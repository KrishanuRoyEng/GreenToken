import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateProjectData } from '../utils/validation';
import { CARBON_CREDIT_RATES, PROJECT_STATUS } from '../utils/constants';
import { io } from '../app';
import PrismaClientSingleton from '../lib/prisma';


export class ProjectController {
  createProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = validateProjectData(req.body);
    
    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    if (error) {
      return next(createError(error.details[0].message, 400));
    }

    const userId = req.user.id;
    const projectData = value;

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

  getUserProjects = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();
    
    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      include: {
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

    // Get Prisma client lazily
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
    const { id } = req.params;

    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { 
            id: true, 
            name: true, 
            organizationName: true, 
            email: true 
          }
        },
        documents: true,
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

    res.json(project);
  });

  updateProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, location } = req.body;

    // Get Prisma client lazily
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
    const { id } = req.params;

    // Get Prisma client lazily
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

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date()
      }
    });

    // Create notification for project owner
    await prisma.notification.create({
      data: {
        title: 'Project Approved',
        message: `Your project "${project.name}" has been approved!`,
        type: 'success',
        userId: project.ownerId
      }
    });

    // Notify owner via socket
    io.to(`user-${project.ownerId}`).emit('project-approved', {
      message: 'Your project has been approved!',
      project: updatedProject
    });

    logger.info(`Project approved: ${project.name} by ${req.user.email}`);

    res.json({
      message: 'Project approved successfully',
      project: updatedProject
    });
  });

  rejectProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { reason } = req.body;

    // Get Prisma client lazily
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

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: 'REJECTED'
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

    logger.info(`Project rejected: ${project.name} by ${req.user.email}`);

    res.json({
      message: 'Project rejected',
      project: updatedProject
    });
  });

  private calculateEstimatedCredits(areaHectares: number, ecosystemType: string): number {
    const rate = CARBON_CREDIT_RATES[ecosystemType as keyof typeof CARBON_CREDIT_RATES] || 5;
    return Math.round(areaHectares * rate);
  }
}
