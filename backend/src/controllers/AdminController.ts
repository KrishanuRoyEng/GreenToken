import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { validateCreditIssuance } from "../utils/validation";
import { io } from "../app";
import PrismaClientSingleton from "../lib/prisma";

export class AdminController {
  getSystemStats = asyncHandler(async (req: Request, res: Response) => {

    //lazy initialization
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

    //lazy initialization
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

      //lazy initialization
      const prisma = await PrismaClientSingleton.getInstance();

      const { userId } = req.params;
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

      //lazy initialization
      const prisma = await PrismaClientSingleton.getInstance();

      const { userId } = req.params;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return next(createError("User not found", 404));
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });

      // Create notification for user
      await prisma.notification.create({
        data: {
          title: "Account Verified",
          message: "Your account has been verified by administrators",
          type: "success",
          userId,
        },
      });

      logger.info(`User verified: ${user.email} by ${req.user.email}`);

      res.json({
        message: "User verified successfully",
      });
    }
  );

  issueCredits = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {

      //lazy initialization
      const prisma = await PrismaClientSingleton.getInstance();

      const { projectId } = req.params;
      const { error, value } = validateCreditIssuance(req.body);

      if (error) {
        return next(createError(error.details[0].message, 400));
      }

      const { amount, verificationData } = value;

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

      // Create notification for project owner
      await prisma.notification.create({
        data: {
          title: "Credits Issued",
          message: `${amount} carbon credits have been issued for your project "${project.name}"`,
          type: "success",
          userId: project.ownerId,
        },
      });

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
    
    //lazy initialization
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

    //lazy initialization
    const prisma = await PrismaClientSingleton.getInstance();

    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    await prisma.notification.create({
      data: {
        title: "Project Approved",
        message: `Your project "${project.name}" has been approved`,
        type: "success",
        userId: project.ownerId,
      },
    });

    return res.json({ project: updatedProject }); // <- explicit return
  });

  rejectProject = asyncHandler(async (req: Request, res: Response) => {

    //lazy initialization
    const prisma = await PrismaClientSingleton.getInstance();
    
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    // Optionally, notify the project owner
    await prisma.notification.create({
      data: {
        title: "Project Rejected",
        message: `Your project "${project.name}" has been rejected`,
        type: "error",
        userId: project.ownerId,
      },
    });

    return res.json({
      project: updatedProject,
      message: "Project rejected successfully",
    });
  });
}
