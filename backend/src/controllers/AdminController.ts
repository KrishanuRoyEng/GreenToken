import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { validateCreditIssuance } from "../utils/validation";
import { io } from "../app";
import { ipfsService } from "../services/IPFSService";
import { notificationService } from "../services";
import PrismaClientSingleton from "../lib/prisma";

export class AdminController {
  getSystemStats = asyncHandler(async (req: Request, res: Response) => {

    const prisma = await PrismaClientSingleton.getInstance();
    const [
      totalUsers,
      totalProjects,
      pendingProjects,
      approvedProjects,
      totalCreditsIssued,
      totalTransactions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.project.count({ where: { status: "PENDING" } }),
      prisma.project.count({ where: { status: "APPROVED" } }),
      prisma.project.aggregate({
        _sum: { issuedCredits: true },
      }),
      prisma.transaction.count(),
    ]);

    // Get recent activity
    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { name: true, organizationName: true } },
      },
    });

    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    res.json({
      stats: {
        totalUsers,
        totalProjects,
        pendingProjects,
        approvedProjects,
        totalCreditsIssued: totalCreditsIssued._sum.issuedCredits || 0,
        totalTransactions,
      },
      recentActivity: {
        projects: recentProjects,
        transactions: recentTransactions,
      },
    });
  });

  getAllUsers = asyncHandler(async (req: Request, res: Response) => {


    const prisma = await PrismaClientSingleton.getInstance();

    const { page = 1, limit = 20, role, search } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        {
          organizationName: { contains: search as string, mode: "insensitive" },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        organizationName: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  });

  updateUserRole = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {

      const prisma = await PrismaClientSingleton.getInstance();

      const userId = req.params.userId as string;
      const { role } = req.body;

      const validRoles = [
        "NGO",
        "PANCHAYAT",
        "COMMUNITY",
        "RESEARCHER",
        "VERIFIER",
        "ADMIN",
      ];
      if (!validRoles.includes(role)) {
        return next(createError("Invalid role specified", 400));
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return next(createError("User not found", 404));
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationName: true,
        },
      });

      logger.info(
        `User role updated: ${user.email} -> ${role} by ${req.user.email}`
      );

      res.json({
        message: "User role updated successfully",
        user: updatedUser,
      });
    }
  );

  verifyUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {

      const prisma = await PrismaClientSingleton.getInstance();

      const userId = req.params.userId as string;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return next(createError("User not found", 404));
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });

      // Create notification for user
      await notificationService.notifyAccountVerified(userId, user.email);

      logger.info(`User verified: ${user.email} by ${req.user.email}`);

      res.json({
        message: "User verified successfully",
      });
    }
  );

  issueCredits = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {

      const prisma = await PrismaClientSingleton.getInstance();

      const projectId = req.params.projectId as string;
      const result = validateCreditIssuance(req.body);

      if (!result.success) {
        return next(
          createError(
            result.error.issues.map((i) => i.message).join(', '),
            400
          )
        );
      }

      const { amount, verificationData } = result.data;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { owner: true },
      });

      if (!project) {
        return next(createError("Project not found", 404));
      }

      if (project.status !== "APPROVED") {
        return next(
          createError("Project must be approved before issuing credits", 400)
        );
      }

      // Update project with issued credits
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          issuedCredits: project.issuedCredits + amount,
          status: "ACTIVE",
        },
      });

      // Record the credit issuance transaction
      await prisma.transaction.create({
        data: {
          type: "mint",
          amount,
          status: "confirmed",
          userId: project.ownerId,
          projectId,
        },
      });

      // Notify project owner
      await notificationService.notifyCreditsIssued(project.ownerId, project.owner.email, amount, project.name);

      // Notify project owner via socket
      io.to(`user-${project.ownerId}`).emit("credits-issued", {
        message: `${amount} credits issued for ${project.name}`,
        amount,
        project: updatedProject,
      });

      logger.info(
        `Credits issued: ${amount} for project ${project.name} by ${req.user.email}`
      );

      res.json({
        message: "Credits issued successfully",
        issuance: {
          amount,
          project: updatedProject.name,
          totalCredits: updatedProject.issuedCredits,
        },
      });
    }
  );

  getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {

    const prisma = await PrismaClientSingleton.getInstance();

    const pendingProjects = await prisma.project.findMany({
      where: { status: "PENDING" },
      include: {
        owner: {
          select: { name: true, organizationName: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(pendingProjects);
  });

  approveProject = asyncHandler(async (req: Request, res: Response) => {

    const prisma = await PrismaClientSingleton.getInstance();

    const projectId = req.params.projectId as string;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true }
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.status !== "PENDING") {
      return res
        .status(400)
        .json({ error: "Only pending projects can be approved" });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    await notificationService.notifyProjectApproved(project.ownerId, project.owner?.email || "", project.name);

    return res.json({ project: updatedProject }); // <- explicit return
  });

  rejectProject = asyncHandler(async (req: Request, res: Response) => {

    const prisma = await PrismaClientSingleton.getInstance();

    const projectId = req.params.projectId as string;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true }
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.status !== "PENDING") {
      return res
        .status(400)
        .json({ error: "Only pending projects can be rejected" });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status: "REJECTED" },
    });

    await notificationService.notifyProjectRejected(project.ownerId, project.owner?.email || "", project.name, "Rejected by admin");

    await notificationService.notifyProjectRejected(project.ownerId, project.owner?.email || "", project.name, "Rejected by admin");

    return res.json({
      project: updatedProject,
      message: "Project rejected successfully",
    });
  });

  getProjects = asyncHandler(async (req: Request, res: Response) => {
    const prisma = await PrismaClientSingleton.getInstance();

    const { page = 1, limit = 10, status, search, sort = "desc" } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { location: { contains: search as string, mode: "insensitive" } },
        {
          owner: {
            OR: [
              { name: { contains: search as string, mode: "insensitive" } },
              { organizationName: { contains: search as string, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { name: true, organizationName: true, email: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.project.count({ where });

    res.json({
      projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  });

  getMapData = asyncHandler(async (req: Request, res: Response) => {
    const prisma = await PrismaClientSingleton.getInstance();

    // Fetch real projects that are APPROVED or ACTIVE
    const projects = await prisma.project.findMany({
      where: {
        status: { in: ["APPROVED", "ACTIVE", "COMPLETED", "PENDING"] },
        latitude: { not: 0 }, // Ensure valid coordinates
        longitude: { not: 0 }
      },
      select: {
        id: true,
        name: true,
        ecosystemType: true,
        location: true,
        latitude: true,
        longitude: true,
        areaHectares: true,
        issuedCredits: true,
        estimatedCredits: true,
        documents: {
          where: {
            documentType: { in: ["IMAGE", "DRONE_DATA", "REPORT"] }
          },
          select: {
            id: true,
            documentType: true,
            ipfsHash: true,
            originalName: true
          }
        }
      }
    });

    // Transform to matching frontend format
    // Transform to matching frontend format
    const regions = projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.ecosystemType,
      coordinates: [p.latitude, p.longitude],
      location: p.location,
      stats: {
        area: `${p.areaHectares} ha`,
        health: "Monitoring Active", // Placeholder for real monitoring data logic
        carbon: `${p.issuedCredits || p.estimatedCredits || 0} credits`
      },
      images: p.documents
        .filter((d: any) => d.documentType === 'IMAGE' && d.ipfsHash)
        .map((d: any) => ipfsService.getGatewayUrl(d.ipfsHash)),
      documents: p.documents.map((d: any) => ({
        type: d.documentType,
        name: d.originalName,
        url: d.ipfsHash ? ipfsService.getGatewayUrl(d.ipfsHash) : null
      }))
    }));

    res.json(regions);
  });
}
