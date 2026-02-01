import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateProjectData } from '../utils/validation';
import { CARBON_CREDIT_RATES, PROJECT_STATUS } from '../utils/constants';
import { io } from '../app';
import PrismaClientSingleton from '../lib/prisma';
import { ipfsService } from '../services/IPFSService';
import { blockchainService } from '../services/BlockchainServices';

export class ProjectController {
  createProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = validateProjectData(req.body);

    const prisma = await PrismaClientSingleton.getInstance();

    if (!result.success) {
      return next(
        createError(
          result.error.issues.map((i) => i.message).join(', '),
          400
        )
      );
    }

    const userId = req.user.id;
    const projectData = result.data;
    const documentIds = projectData.documentIds || [];

    // Calculate estimated credits
    const estimatedCredits = this.calculateEstimatedCredits(
      projectData.areaHectares,
      projectData.ecosystemType
    );

    // 1. Create project in database
    const project = await prisma.project.create({
      data: {
        name: projectData.name,
        description: projectData.description,
        location: projectData.location,
        latitude: projectData.latitude,
        longitude: projectData.longitude,
        areaHectares: projectData.areaHectares,
        ecosystemType: projectData.ecosystemType,
        ownerId: userId,
        estimatedCredits
      }
    });

    // 2. Link documents to project
    if (documentIds.length > 0) {
      await prisma.document.updateMany({
        where: {
          id: { in: documentIds },
          projectId: null // Only claim unlinked documents
        },
        data: { projectId: project.id }
      });
    }

    // 3. Fetch full project with documents for finalization
    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        documents: true,
        owner: { select: { id: true, name: true, organizationName: true, walletAddress: true } }
      }
    });

    if (!fullProject) {
      return next(createError('Failed to retrieve created project', 500));
    }

    // 4. Finalization Logic (Blockchain & IPFS)

    // Check for mandatory images
    const images = fullProject.documents.filter((d: any) => d.documentType === 'IMAGE');
    if (images.length < 1) {
      // If atomic creation fails requirements, delete the project
      await prisma.project.delete({ where: { id: project.id } });
      return next(createError('At least 1 image is required for project submission', 400));
    }

    // Collect document hashes
    const documentHashes = fullProject.documents
      .filter((d: any) => d.ipfsHash)
      .map((d: any) => d.ipfsHash as string);

    // Generate project data hash
    const dataHash = blockchainService.hashProjectData({
      name: fullProject.name,
      location: fullProject.location,
      latitude: fullProject.latitude,
      longitude: fullProject.longitude,
      areaHectares: fullProject.areaHectares,
      ecosystemType: fullProject.ecosystemType,
      ownerId: fullProject.ownerId,
      documentHashes
    });

    // Create Metadata
    const projectMetadata = {
      id: fullProject.id,
      name: fullProject.name,
      description: fullProject.description,
      location: fullProject.location,
      coordinates: { lat: fullProject.latitude, lng: fullProject.longitude },
      area: fullProject.areaHectares,
      ecosystemType: fullProject.ecosystemType,
      owner: fullProject.owner.name,
      documents: documentHashes,
      dataHash,
      timestamp: new Date().toISOString()
    };

    // Upload Metadata to IPFS
    const ipfsMetadataHash = await ipfsService.uploadJSON(projectMetadata);

    // Submit to Blockchain
    let blockchainId = 0;
    let txHash = '';

    try {
      const result = await blockchainService.submitProject(
        fullProject.name,
        fullProject.location,
        fullProject.latitude,
        fullProject.longitude,
        fullProject.areaHectares,
        fullProject.ecosystemType,
        ipfsMetadataHash
      );
      blockchainId = result.blockchainId;
      txHash = result.txHash;
      logger.info(`Project submitted to blockchain: ${blockchainId}, tx: ${txHash}`);
    } catch (error: any) {
      logger.error(`Failed to submit project to blockchain: ${error.message}`);
    }

    // Update project with final details
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        dataHash,
        ipfsMetadataHash,
        blockchainId: blockchainId > 0 ? blockchainId : undefined,
      },
      include: {
        documents: true,
        owner: { select: { id: true, name: true, organizationName: true } }
      }
    });

    // Notify admins
    io.to('admin-room').emit('new-project', {
      message: `New project "${updatedProject.name}" submitted for approval`,
      project: updatedProject
    });

    logger.info(`Project created and finalized: ${updatedProject.name} by ${req.user.email}`);

    res.status(201).json({
      message: 'Project created and submitted successfully',
      project: updatedProject,
      ipfsMetadataHash,
      dataHash
    });
  });

  getUserProjects = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const prisma = await PrismaClientSingleton.getInstance();

    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      include: {
        documents: {
          select: { id: true, documentType: true, originalName: true, ipfsHash: true }
        },
        _count: {
          select: { documents: true, monitoringData: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(projects);
  });

  getAllProjects = asyncHandler(async (req: Request, res: Response) => {
    const { status, ecosystemType, page = 1, limit = 10 } = req.query;

    const prisma = await PrismaClientSingleton.getInstance();

    const where: any = {};
    if (status) where.status = status;
    if (ecosystemType) where.ecosystemType = ecosystemType;

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: { name: true, organizationName: true }
        },
        documents: {
          select: { id: true, documentType: true, ipfsHash: true, originalName: true }
        },
        _count: {
          select: { documents: true }
        }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.project.count({ where });

    res.json({
      projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  });

  getProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;

    const prisma = await PrismaClientSingleton.getInstance();

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            organizationName: true,
            email: true,
            walletAddress: true,
            usesCustodianWallet: true
          }
        },
        documents: {
          orderBy: { uploadedAt: 'desc' }
        },
        monitoringData: {
          orderBy: { measuredAt: 'desc' },
          take: 10
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!project) {
      return next(createError('Project not found', 404));
    }

    // Add IPFS gateway URLs for documents
    const projectWithUrls = {
      ...project,
      documents: project.documents.map((doc: any) => ({
        ...doc,
        ipfsUrl: doc.ipfsHash ? ipfsService.getGatewayUrl(doc.ipfsHash) : null
      })),
      ipfsMetadataUrl: project.ipfsMetadataHash
        ? ipfsService.getGatewayUrl(project.ipfsMetadataHash)
        : null
    };

    res.json(projectWithUrls);
  });

  updateProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const userId = req.user.id;
    const { name, description, location } = req.body;

    const prisma = await PrismaClientSingleton.getInstance();

    // Check if project exists and user owns it
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        ownerId: userId
      }
    });

    if (!existingProject) {
      return next(createError('Project not found or access denied', 404));
    }

    // Can only update pending projects
    if (existingProject.status !== 'PENDING') {
      return next(createError('Cannot update approved projects', 400));
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { name, description, location },
      include: {
        owner: {
          select: { name: true, organizationName: true }
        }
      }
    });

    logger.info(`Project updated: ${updatedProject.name}`);

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  });

  approveProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;

    const prisma = await PrismaClientSingleton.getInstance();

    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: true }
    });

    if (!project) {
      return next(createError('Project not found', 404));
    }

    if (project.status !== 'PENDING') {
      return next(createError('Project is not pending approval', 400));
    }

    // Approve project on blockchain
    let blockchainTxHash = '';

    try {
      if (project.blockchainId) {
        blockchainTxHash = await blockchainService.approveProject(project.blockchainId);
      } else {
        // Fallback if not on blockchain yet (shouldn't happen in production flow)
        logger.warn(`Project ${project.id} has no blockchain ID. Skipping on-chain approval.`);
        blockchainTxHash = await blockchainService.submitToBlockchain(project.dataHash || project.id, { type: 'PROJECT_APPROVAL' });
      }
    } catch (error: any) {
      logger.error(`Failed to approve project on blockchain: ${error.message}`);
      // Don't block DB update, but log error
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        // blockchainId is already set from submission time
      }
    });

    // Create notification for project owner
    await prisma.notification.create({
      data: {
        title: 'Project Approved',
        message: `Your project "${project.name}" has been approved! Blockchain TX: ${blockchainTxHash.substring(0, 18)}...`,
        type: 'success',
        userId: project.ownerId
      }
    });

    // Notify owner via socket
    io.to(`user-${project.ownerId}`).emit('project-approved', {
      message: 'Your project has been approved!',
      project: updatedProject,
      txHash: blockchainTxHash
    });

    logger.info(`Project approved: ${project.name} by ${req.user.email}, TX: ${blockchainTxHash}`);

    res.json({
      message: 'Project approved successfully',
      project: updatedProject,
      blockchain: {
        txHash: blockchainTxHash,
        timestamp: Date.now()
      }
    });
  });

  rejectProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const { reason } = req.body;

    const prisma = await PrismaClientSingleton.getInstance();

    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: true }
    });

    if (!project) {
      return next(createError('Project not found', 404));
    }

    if (project.status !== 'PENDING') {
      return next(createError('Project is not pending approval', 400));
    }

    // Create blockchain attestation for rejection
    const attestation = blockchainService.createRejectionAttestation(
      project.id,
      reason || 'No reason provided',
      req.user.walletAddress || 'platform'
    );

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'No reason provided'
      }
    });

    // Create notification for project owner
    await prisma.notification.create({
      data: {
        title: 'Project Rejected',
        message: `Your project "${project.name}" was rejected. Reason: ${reason || 'No reason provided'}`,
        type: 'error',
        userId: project.ownerId
      }
    });

    // Notify owner via socket
    io.to(`user-${project.ownerId}`).emit('project-rejected', {
      message: 'Your project was rejected',
      project: updatedProject,
      reason
    });

    logger.info(`Project rejected: ${project.name} by ${req.user.email}, Reason: ${reason}`);

    res.json({
      message: 'Project rejected',
      project: updatedProject,
      rejection: {
        reason: reason || 'No reason provided',
        attestation: attestation.attestation,
        timestamp: attestation.timestamp
      }
    });
  });

  private calculateEstimatedCredits(areaHectares: number, ecosystemType: string): number {
    const rate = CARBON_CREDIT_RATES[ecosystemType as keyof typeof CARBON_CREDIT_RATES] || 5;
    return Math.round(areaHectares * rate);
  }
}
