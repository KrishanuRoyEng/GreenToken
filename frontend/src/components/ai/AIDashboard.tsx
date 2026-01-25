import React, { useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { projectService } from '../../services/api';


import { logger } from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AIDashboard: React.FC = () => {
    // ... state ...
    const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    // Manual Input State
    const [manualInput, setManualInput] = useState({
        area: 10,
        salinity: 30,
        soil_carbon: 150,
        age: 5,
        latitude: 20.5937,
        longitude: 78.9629
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            logger.info('File selected for upload', { fileName: e.target.files[0].name, size: e.target.files[0].size });
        }
    };

    const processFile = async () => {
        if (!file) return;
        setIsLoading(true);
        setResults(null);
        logger.info('Starting file processing', { fileName: file.name });

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Get token from localStorage if you have auth
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/ai/process-file`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            setResults({ type: 'file', data: res.data });
            toast.success('File processed successfully by AI');
            logger.info('File processing successful', { siteCount: res.data.preview_data?.length });
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || 'Failed to process file';
            toast.error(errorMsg);
            console.error(error);
            logger.error('File processing failed', { error: errorMsg });
        } finally {
            setIsLoading(false);
        }
    };

    const predictManual = async () => {
        setIsLoading(true);
        setResults(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/ai/predict`, manualInput, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setResults({ type: 'manual', data: res.data });
            toast.success('Prediction complete');
        } catch (error: any) {
            toast.error('Prediction failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProject = async (data: any, type: 'manual' | 'file') => {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const projectData = {
                name: type === 'manual' ? `AI Prediction ${timestamp}` : data.name || `AI Site ${timestamp}`,
                description: "Automated project creation from AI Ecosystem Analysis.",
                location: data.location || `Lat: ${data.latitude}, Lng: ${data.longitude}`,
                latitude: Number(data.latitude) || 0,
                longitude: Number(data.longitude) || 0,
                areaHectares: Number(data.area) || Number(data.areaHectares) || Number(data.potential_credits / 10) || 5,
                ecosystemType: data.ecosystemType || "MANGROVE",
            };

            await projectService.createProject(projectData);
            toast.success("Project saved to Map & Database!");
        } catch (error) {
            toast.error("Failed to save project");
            console.error(error);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="text-2xl">🤖</span> AI Ecosystem Analyst
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Use Machine Learning to estimate carbon potential from data.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`pb-2 px-1 font-medium text-sm transition-colors ${activeTab === 'upload'
                        ? 'border-b-2 border-ocean-500 text-ocean-600 dark:text-ocean-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                >
                    📁 Batch Data Upload
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`pb-2 px-1 font-medium text-sm transition-colors ${activeTab === 'manual'
                        ? 'border-b-2 border-ocean-500 text-ocean-600 dark:text-ocean-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                >
                    🧮 Calculator
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left: Inputs */}
                <div>
                    {activeTab === 'upload' ? (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <input
                                    type="file"
                                    accept=".csv,.geojson,.json,.xlsx"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                    <span className="text-4xl mb-2">📄</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {file ? file.name : "Click to Upload CSV / GeoJSON"}
                                    </span>
                                    <span className="text-xs text-slate-500 mt-1">Supported: .csv, .geojson, .xlsx</span>
                                </label>
                            </div>
                            <Button onClick={processFile} disabled={!file || isLoading} className="w-full">
                                {isLoading ? <LoadingSpinner size="small" /> : "Analyze Data"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Area (Hectares)</label>
                                <input
                                    type="number"
                                    value={manualInput.area}
                                    onChange={e => setManualInput({ ...manualInput, area: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Salinity (ppt)</label>
                                <input
                                    type="number"
                                    value={manualInput.salinity}
                                    onChange={e => setManualInput({ ...manualInput, salinity: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Soil Carbon (Mg/ha)</label>
                                <input
                                    type="number"
                                    value={manualInput.soil_carbon}
                                    onChange={e => setManualInput({ ...manualInput, soil_carbon: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age (Years)</label>
                                <input
                                    type="number"
                                    value={manualInput.age}
                                    onChange={e => setManualInput({ ...manualInput, age: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Coordinates (Lat / Lng)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Lat"
                                        value={manualInput.latitude}
                                        onChange={e => setManualInput({ ...manualInput, latitude: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Lng"
                                        value={manualInput.longitude}
                                        onChange={e => setManualInput({ ...manualInput, longitude: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg"
                                    />
                                </div>
                            </div>
                            <Button onClick={predictManual} disabled={isLoading} className="w-full">
                                {isLoading ? <LoadingSpinner size="small" /> : "Predict Carbon"}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right: Results */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 min-h-[300px] flex items-center justify-center">
                    {!results && !isLoading && (
                        <div className="text-center text-slate-400">
                            <span className="text-4xl block mb-2">📊</span>
                            Results will appear here
                        </div>
                    )}

                    {isLoading && <LoadingSpinner size="large" />}

                    {results && results.type === 'manual' && (
                        <div className="w-full">
                            <h3 className="text-lg font-bold mb-4 text-center">Prediction Results</h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-center shadow-sm">
                                    <p className="text-sm text-slate-500">Carbon Credits</p>
                                    <p className="text-2xl font-bold text-kelp-600">{results.data.predicted_carbon_credits}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-center shadow-sm">
                                    <p className="text-sm text-slate-500">Est. Value (USD)</p>
                                    <p className="text-2xl font-bold text-ocean-600">${results.data.ecosystem_valuation_usd}</p>
                                </div>
                            </div>

                            <h4 className="text-sm font-medium mb-2">AI Confidence Score</h4>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${results.data.confidence_score * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-right text-slate-500">{(results.data.confidence_score * 100).toFixed(0)}% Confidence</p>

                            <Button variant="secondary" className="w-full mt-4" onClick={() => handleSaveProject({ ...manualInput, ...results.data }, 'manual')}>
                                Save to Map 🗺️
                            </Button>
                        </div>
                    )}

                    {results && results.type === 'file' && (
                        <div className="w-full">
                            <h3 className="text-lg font-bold mb-2">Batch Analysis Complete</h3>
                            <p className="text-sm text-slate-500 mb-4">{results.data.message}</p>

                            <div className="h-[200px] w-full mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={results.data.preview_data.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" hide />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="potential_credits" fill="#0ea5e9" name="Credits" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-kelp-50 dark:bg-kelp-900/20 p-4 rounded-lg border border-kelp-200 dark:border-kelp-800">
                                <p className="text-sm text-kelp-700 dark:text-kelp-300 font-medium">
                                    Total Potential Detected: <span className="text-xl font-bold ml-2">{results.data.total_estimated_credits.toFixed(2)} Credits</span>
                                </p>
                            </div>

                            <Button variant="secondary" className="w-full mt-4" onClick={() => {
                                // Keep the first 3 sites for import
                                results.data.preview_data.slice(0, 3).forEach((site: any) => handleSaveProject(site, 'file'));
                                toast.success("Started importing top 3 sites...");
                            }}>
                                Import Sites to Map 🗺️
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIDashboard;
