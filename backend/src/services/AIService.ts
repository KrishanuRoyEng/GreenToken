import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';
import { logger } from '../utils/logger';

class AIService {
    private baseURL: string;

    constructor() {
        // Docker networking: 'ai-service' is the hostname
        this.baseURL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
    }

    /**
     * Check if AI service is healthy
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseURL}/`);
            return response.status === 200;
        } catch (error: any) {
            logger.error(`AI Service health check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Predict carbon potential based on parameters
     */
    async predictCarbonPotential(data: {
        area: number;
        salinity?: number;
        soil_carbon?: number;
        age?: number;
    }) {
        try {
            const response = await axios.post(`${this.baseURL}/analyze/carbon-potential`, data);
            return response.data;
        } catch (error: any) {
            logger.error(`AI Prediction failed: ${error.message}`);
            throw new Error('AI Service unavailable or returned error');
        }
    }

    /**
     * Process uploaded geo-data file
     */
    async processGeoData(fileBuffer: Buffer, filename: string, mimeType: string) {
        try {
            const formData = new FormData();
            formData.append('file', fileBuffer, {
                filename: filename,
                contentType: mimeType,
            });

            const response = await axios.post(`${this.baseURL}/process/geo-data`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });

            return response.data;
        } catch (error: any) {
            logger.error(`AI Geo-processing failed: ${error.message}`);
            throw new Error(error.response?.data?.detail || 'AI Service processing failed');
        }
    }
}

export const aiService = new AIService();
