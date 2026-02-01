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

    // Calculate estimated credits
    const estimatedCredits = this.calculateEstimatedCredits(
      projectData.areaHectares,
      projectData.ecosystemType
    );

    // Create project in database
    const project = await prisma.project.create({
      data: {
        ...projectData,
        ownerId: userId,
        estimatedCredits
      },
      include: {
        owner: {
          select: { id: true, name: true, organizationName: true }
        }
      }
    });

    // Notify admins
    io.to('admin-room').emit('new-project', {
      message: `New project "${project.name}" submitted for approval`,
      project
    });

    logger.info(`Project created: ${project.name} by ${req.user.email}`);

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  });

  // Finalize project with images - call this after uploading documents
  finalizeProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.id as string;
    const userId = req.user.id;
    const prisma = await PrismaClientSingleton.getInstance();

    // Get project with documents
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
      include: {
        documents: true,
        owner: { select: { id: true, name: true, walletAddress: true } }
      }
    });

    if (!project) {
      return next(createError('Project not found or access denied', 404));
    }

    // Check for mandatory images
    const images = project.documents.filter((d: any) => d.documentType === 'IMAGE');
    if (images.length < 1) {
      return next(createError('At least 1 image is required for project submission', 400));
    }

    // Collect document hashes
    const documentHashes = project.documents
      .filter((d: any) => d.ipfsHash)
      .map((d: any) => d.ipfsHash as string);

    // Generate project data hash for blockchain integrity
    const dataHash = blockchainService.hashProjectData({
      name: project.name,
      location: project.location,
      latitude: project.latitude,
      longitude: project.longitude,
      areaHectares: project.areaHectares,
      ecosystemType: project.ecosystemType,
      ownerId: project.ownerId,
      documentHashes
    });

    // Create full project metadata for IPFS
    const projectMetadata = {
      id: project.id,
      name: project.name,
      description: project.description,
      location: project.location,
      coordinates: { lat: project.latitude, lng: project.longitude },
      area: project.areaHectares,
      ecosystemType: project.ecosystemType,
      owner: project.owner.name,
      documents: documentHashes,
      dataHash,
      timestamp: new Date().toISOString()
    };

    // Upload metadata to IPFS
    const ipfsMetadataHash = await ipfsService.uploadJSON(projectMetadata);

    // Submit project to blockchain
    let blockchainId = 0;
    let txHash = '';

    try {
      const result = await blockchainService.submitProject(
        project.name,
        project.location,
        project.latitude,
        project.longitude,
        project.areaHectares,
        project.ecosystemType,
        ipfsMetadataHash
      );
      blockchainId = result.blockchainId;
      txHash = result.txHash;
      logger.info(`Project submitted to blockchain: ${blockchainId}, tx: ${txHash}`);
    } catch (error: any) {
      logger.error(`Failed to submit project to blockchain: ${error.message}`);
      // Continue anyway, admin can retry or Fix it later? 
      // For now, we'll continue but log it. In strict mode, we might want to fail the request.
    }

    // Update project with hashes and blockchain info
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        dataHash,
        ipfsMetadataHash,
        status: 'PENDING', // Ready for admin review
        blockchainId: blockchainId > 0 ? blockchainId : undefined,
        // We could store txHash in a separate column or metadata, but for now we log it
      },
      include: {
        documents: true,
        owner: { select: { name: true, organizationName: true } }
      }
    });

    logger.info(`Project finalized with IPFS hash: ${project.name}, hash: ${ipfsMetadataHash}`);

    // Notify admins
    io.to('admin-room').emit('project-ready', {
      message: `Project "${project.name}" is ready for review`,
      project: updatedProject
    });

    res.json({
      message: 'Project finalized and submitted for review',
      project: updatedProject,
      ipfsMetadataHash,
      dataHash,
      ipfsGatewayUrl: ipfsService.getGatewayUrl(ipfsMetadataHash)
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
