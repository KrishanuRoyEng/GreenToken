import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../utils/constants';
import PrismaClientSingleton from '../lib/prisma';


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

export class UploadController {
  uploadFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(createError('No file uploaded', 400));
    }

    const { projectId } = req.body;

    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();
    
    // Save file info to database
    const document = await prisma.document.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        projectId: projectId || null
      }
    });

    logger.info(`File uploaded: ${req.file.originalname} by ${req.user.email}`);

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        size: document.size,
        uploadedAt: document.uploadedAt
      }
    });
  });

  getFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { fileId } = req.params;

    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    const document = await prisma.document.findUnique({
      where: { id: fileId },
      include: { project: true }
    });

    if (!document) {
      return next(createError('File not found', 404));
    }

    const filePath = path.join(__dirname, '../../uploads', document.filename);
    
    if (!fs.existsSync(filePath)) {
      return next(createError('File not found on disk', 404));
    }

    res.download(filePath, document.originalName);
  });

  deleteFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { fileId } = req.params;

    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    const document = await prisma.document.findUnique({
      where: { id: fileId },
      include: { project: true }
    });

    if (!document) {
      return next(createError('File not found', 404));
    }

    // Check if user owns the project or is admin
    if (document.project && document.project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(createError('Access denied', 403));
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '../../uploads', document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.document.delete({ where: { id: fileId } });

    logger.info(`File deleted: ${document.originalName} by ${req.user.email}`);

    res.json({ message: 'File deleted successfully' });
  });
}
