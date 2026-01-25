import { Router, Request, Response } from 'express';
import { aiService } from '../services/AIService';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Protect all routes
router.use(authenticateToken, requireAdmin);

// Health check for AI service
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
    const isHealthy = await aiService.healthCheck();
    if (isHealthy) {
        return res.json({ status: 'online', service: 'AI Service' });
    } else {
        return res.status(503).json({ status: 'offline', message: 'AI Service unable to respond' });
    }
}));

// Predict carbon potential
router.post('/predict', asyncHandler(async (req: Request, res: Response) => {
    const { area, salinity, soil_carbon, age } = req.body;

    if (!area) {
        return res.status(400).json({ message: 'Area is required' });
    }

    const prediction = await aiService.predictCarbonPotential({
        area: Number(area),
        salinity: salinity ? Number(salinity) : undefined,
        soil_carbon: soil_carbon ? Number(soil_carbon) : undefined,
        age: age ? Number(age) : undefined
    });

    return res.json(prediction);
}));

// Process uploaded geo-file
router.post('/process-file', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await aiService.processGeoData(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
    );

    return res.json(result);
}));

export default router;
