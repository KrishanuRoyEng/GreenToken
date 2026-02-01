import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../utils/constants';
import PrismaClientSingleton from '../lib/prisma';
import { ipfsService } from '../services/IPFSService';

// Document types for classification
type DocumentType = 'IMAGE' | 'DRONE_DATA' | 'REPORT' | 'OTHER';

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

// Helper to determine document type from mimetype
function getDocumentType(mimetype: string): DocumentType {
  if (mimetype.startsWith('image/')) {
    return 'IMAGE';
  }
  if (mimetype === 'application/pdf' || mimetype.includes('document')) {
    return 'REPORT';
  }
  return 'OTHER';
}

export class UploadController {
  // Upload file with IPFS integration
  uploadFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(createError('No file uploaded', 400));
    }

    const { projectId, documentType: requestedType } = req.body;

    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    // Verify project exists and user owns it (if projectId provided)
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: req.user.id }
      });
      if (!project) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return next(createError('Project not found or access denied', 404));
      }
    }

    // Read file buffer for IPFS upload
    const fileBuffer = fs.readFileSync(req.file.path);

    // Upload to IPFS
    const ipfsHash = await ipfsService.uploadFile(fileBuffer, req.file.originalname);

    // Determine document type
    const docType: DocumentType = requestedType as DocumentType || getDocumentType(req.file.mimetype);
    const isRequired = docType === 'IMAGE'; // Images are required for projects

    // Save file info to database
    const document = await prisma.document.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        projectId: projectId || null,
        ipfsHash,
        documentType: docType,
        isRequired
      }
    });

    logger.info(`File uploaded to IPFS: ${req.file.originalname} -> ${ipfsHash} by ${req.user.email}`);

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        size: document.size,
        documentType: document.documentType,
        ipfsHash: document.ipfsHash,
        ipfsUrl: ipfsService.getGatewayUrl(ipfsHash),
        uploadedAt: document.uploadedAt
      }
    });
  });

  // Upload drone data (optional)
  uploadDroneData = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(createError('No file uploaded', 400));
    }

    const { projectId } = req.body;
    const prisma = await PrismaClientSingleton.getInstance();

    // Verify project ownership (if projectId provided)
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: req.user.id }
      });
      if (!project) {
        fs.unlinkSync(req.file.path);
        return next(createError('Project not found or access denied', 404));
      }
    }

    // Read file and upload to IPFS
    const fileBuffer = fs.readFileSync(req.file.path);
    const ipfsHash = await ipfsService.uploadFile(fileBuffer, req.file.originalname);

    // Save as drone data document
    const document = await prisma.document.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        projectId: projectId || null,
        ipfsHash,
        documentType: 'DRONE_DATA',
        isRequired: false
      }
    });

    logger.info(`Drone data uploaded: ${req.file.originalname} -> ${ipfsHash}`);

    res.json({
      message: 'Drone data uploaded successfully',
      file: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        documentType: 'DRONE_DATA',
        ipfsHash: document.ipfsHash,
        ipfsUrl: ipfsService.getGatewayUrl(ipfsHash),
        uploadedAt: document.uploadedAt
      }
    });
  });

  // Get file (with IPFS fallback)
  getFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const fileId = req.params.fileId as string;

    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    const document = await prisma.document.findUnique({
      where: { id: fileId },
      include: { project: { select: { id: true, ownerId: true } } }
    });

    if (!document) {
      return next(createError('File not found', 404));
    }

    // Try local file first
    const filePath = path.join(__dirname, '../../uploads', document.filename);

    if (fs.existsSync(filePath)) {
      return res.download(filePath, document.originalName);
    }

    // If local file not found but has IPFS hash, redirect to IPFS gateway
    if (document.ipfsHash) {
      const ipfsUrl = ipfsService.getGatewayUrl(document.ipfsHash);
      return res.redirect(ipfsUrl);
    }

    return next(createError('File not found', 404));
  });

  // Get file info
  getFileInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const fileId = req.params.fileId as string;
    const prisma = await PrismaClientSingleton.getInstance();

    const document = await prisma.document.findUnique({
      where: { id: fileId },
      include: { project: { select: { id: true, name: true } } }
    });

    if (!document) {
      return next(createError('File not found', 404));
    }

    res.json({
      id: document.id,
      filename: document.filename,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
      documentType: document.documentType,
      ipfsHash: document.ipfsHash,
      ipfsUrl: document.ipfsHash ? ipfsService.getGatewayUrl(document.ipfsHash) : null,
      uploadedAt: document.uploadedAt,
      project: document.project
    });
  });

  deleteFile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const fileId = req.params.fileId as string;

    // Get Prisma client lazily
    const prisma = await PrismaClientSingleton.getInstance();

    const document = await prisma.document.findUnique({
      where: { id: fileId },
      include: { project: { select: { id: true, ownerId: true } } }
    });

    if (!document) {
      return next(createError('File not found', 404));
    }

    // Check if user owns the project or is admin
    const projectOwnerId = document.project?.ownerId;
    if (projectOwnerId && projectOwnerId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(createError('Access denied', 403));
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '../../uploads', document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Note: IPFS files cannot be "deleted" - they remain on the network
    // but can be unpinned. For now we just remove the DB reference.

    // Delete from database
    await prisma.document.delete({ where: { id: fileId } });

    logger.info(`File deleted: ${document.originalName} by ${req.user.email}`);

    res.json({ message: 'File deleted successfully' });
  });

  // Stream IPFS content directly
  streamIPFS = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const cid = req.params.cid as string;

    if (!cid) {
      return next(createError('CID is required', 400));
    }

    try {
      const content = await ipfsService.retrieveFile(cid);

      if (!content || content.length === 0) {
        return next(createError('Content not found in IPFS node', 404));
      }

      // Try to determine mime type (simplistic)
      // In a real app, we might store mime type with CID or detect it

      // Look up document metadata for this CID
      const prisma = await PrismaClientSingleton.getInstance();
      const document = await prisma.document.findFirst({
        where: { ipfsHash: cid }
      });

      if (document && document.mimeType) {
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      } else {
        res.setHeader('Content-Type', 'application/octet-stream');
      }

      res.send(content);
    } catch (error) {
      logger.error(`Failed to stream IPFS content for CID ${cid}:`, error);
      next(createError('Failed to retrieve IPFS content', 500));
    }
  });

  // Get project documents
  getProjectDocuments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.projectId as string;
    const prisma = await PrismaClientSingleton.getInstance();

    const documents = await prisma.document.findMany({
      where: { projectId },
      orderBy: { uploadedAt: 'desc' }
    });

    const documentsWithUrls = documents.map((doc: any) => ({
      ...doc,
      ipfsUrl: doc.ipfsHash ? ipfsService.getGatewayUrl(doc.ipfsHash) : null
    }));

    res.json({
      documents: documentsWithUrls,
      stats: {
        total: documents.length,
        images: documents.filter((d: any) => d.documentType === 'IMAGE').length,
        droneData: documents.filter((d: any) => d.documentType === 'DRONE_DATA').length,
        reports: documents.filter((d: any) => d.documentType === 'REPORT').length
      }
    });
  });
}
