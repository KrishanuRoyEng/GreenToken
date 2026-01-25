import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter, StatusBadge, EcosystemBadge } from '../ui';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { projectService } from '../../services/api';
import toast from 'react-hot-toast';

interface ProjectDetailModalProps {
    project: {
        id: string;
        name: string;
        location?: string;
        ecosystemType?: string;
        status?: string;
    };
    onClose: () => void;
}

interface ProjectDetails {
    id: string;
    name: string;
    description?: string;
    location: string;
    latitude: number;
    longitude: number;
    areaHectares: number;
    ecosystemType: string;
    status: string;
    estimatedCredits?: number;
    issuedCredits?: number;
    createdAt: string;
    updatedAt: string;
    owner?: {
        id: string;
        name: string;
        email: string;
        organizationName?: string;
    };
    documents?: Array<{
        id: string;
        documentType: string;
        originalName: string;
        ipfsHash?: string;
        ipfsUrl?: string;
        createdAt: string;
        uploadedAt?: string;
    }>;
    transactions?: Array<{
        id: string;
        type: string;
        amount: number;
        status: string;
        createdAt: string;
    }>;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
    const [details, setDetails] = useState<ProjectDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'credits'>('info');

    useEffect(() => {
        const loadDetails = async () => {
            setIsLoading(true);
            try {
                const data = await projectService.getProject(project.id);
                setDetails(data);
            } catch (error) {
                toast.error('Failed to load project details');
                onClose();
            } finally {
                setIsLoading(false);
            }
        };
        loadDetails();
    }, [project.id, onClose]);

    if (isLoading || !details) {
        return (
            <Modal isOpen={true} onClose={onClose} title="Loading..." size="lg">
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="large" />
                </div>
            </Modal>
        );
    }

    const getEcosystemGradient = (type: string) => {
        switch (type) {
            case 'MANGROVE': return 'from-kelp-400 to-kelp-600';
            case 'SEAGRASS': return 'from-ocean-400 to-ocean-600';
            case 'SALT_MARSH': return 'from-coastal-400 to-coastal-600';
            case 'KELP': return 'from-cyan-400 to-cyan-600';
            default: return 'from-slate-400 to-slate-600';
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="" size="xl">
            {/* Hero Header */}
            <div className={`-mx-6 -mt-4 mb-6 px-6 py-8 bg-gradient-to-r ${getEcosystemGradient(details.ecosystemType)} text-white`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{details.name}</h2>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={details.status} />
                            <EcosystemBadge ecosystem={details.ecosystemType} />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">{details.areaHectares}</div>
                        <div className="text-white/80 text-sm">hectares</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
                {[
                    { key: 'info', label: 'Information' },
                    { key: 'documents', label: `Documents (${details.documents?.length || 0})` },
                    { key: 'credits', label: 'Carbon Credits' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === tab.key
                            ? 'border-ocean-500 text-ocean-600 dark:text-ocean-400'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Info Tab */}
                {activeTab === 'info' && (
                    <>
                        {/* Location */}
                        <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <div className="p-2 rounded-lg bg-ocean-100 dark:bg-ocean-900/30">
                                <svg className="w-6 h-6 text-ocean-600 dark:text-ocean-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-slate-900 dark:text-white">Location</h4>
                                <p className="text-slate-600 dark:text-slate-400">{details.location}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                    Coordinates: {details.latitude.toFixed(4)}, {details.longitude.toFixed(4)}
                                </p>
                            </div>
                            <a
                                href={`https://www.google.com/maps?q=${details.latitude},${details.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-ocean-600 dark:text-ocean-400 hover:underline"
                            >
                                View on Map →
                            </a>
                        </div>

                        {/* Description */}
                        {details.description && (
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Description</h4>
                                <p className="text-slate-600 dark:text-slate-400">{details.description}</p>
                            </div>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{details.areaHectares}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">Hectares</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-kelp-600 dark:text-kelp-400">{details.estimatedCredits || 0}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">Estimated Credits</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-ocean-600 dark:text-ocean-400">{details.issuedCredits || 0}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">Issued Credits</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{details.documents?.length || 0}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">Documents</div>
                            </div>
                        </div>

                        {/* Owner Info */}
                        {details.owner && (
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="font-medium text-slate-900 dark:text-white mb-3">Project Owner</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ocean-400 to-coastal-500 flex items-center justify-center text-white text-lg font-medium">
                                        {details.owner.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{details.owner.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {details.owner.organizationName || details.owner.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Created:</span>
                                    <span className="ml-2 text-slate-900 dark:text-white">
                                        {new Date(details.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Last Updated:</span>
                                    <span className="ml-2 text-slate-900 dark:text-white">
                                        {new Date(details.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                    <div className="space-y-4">
                        {details.documents && details.documents.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {details.documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-5 h-5 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-xs font-medium text-ocean-600 dark:text-ocean-400 uppercase">
                                                {doc.documentType}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate mb-2">
                                            {doc.originalName}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                            {new Date((doc as any).uploadedAt || doc.createdAt).toLocaleDateString()}
                                        </p>
                                        {doc.ipfsUrl && (
                                            <a
                                                href={doc.ipfsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-xs text-ocean-600 dark:text-ocean-400 hover:underline"
                                            >
                                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                View on IPFS
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-slate-500 dark:text-slate-400">No documents uploaded yet</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Credits Tab */}
                {activeTab === 'credits' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-gradient-to-br from-kelp-50 to-kelp-100 dark:from-kelp-900/20 dark:to-kelp-800/20 rounded-xl border border-kelp-200 dark:border-kelp-800">
                                <div className="text-sm text-kelp-600 dark:text-kelp-400 mb-1">Estimated Credits</div>
                                <div className="text-3xl font-bold text-kelp-700 dark:text-kelp-300">{details.estimatedCredits || 0}</div>
                                <p className="text-xs text-kelp-600/70 dark:text-kelp-400/70 mt-2">
                                    Based on area × ecosystem factor
                                </p>
                            </div>
                            <div className="p-6 bg-gradient-to-br from-ocean-50 to-ocean-100 dark:from-ocean-900/20 dark:to-ocean-800/20 rounded-xl border border-ocean-200 dark:border-ocean-800">
                                <div className="text-sm text-ocean-600 dark:text-ocean-400 mb-1">Issued Credits</div>
                                <div className="text-3xl font-bold text-ocean-700 dark:text-ocean-300">{details.issuedCredits || 0}</div>
                                <p className="text-xs text-ocean-600/70 dark:text-ocean-400/70 mt-2">
                                    Verified and minted
                                </p>
                            </div>
                        </div>

                        {details.transactions && details.transactions.length > 0 ? (
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-3">Transaction History</h4>
                                <div className="space-y-2">
                                    {details.transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'ISSUANCE' ? 'bg-kelp-100 dark:bg-kelp-900/30 text-kelp-600 dark:text-kelp-400' :
                                                    tx.type === 'SALE' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                                        'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-400'
                                                    }`}>
                                                    {tx.type === 'ISSUANCE' ? '+' : tx.type === 'SALE' ? '-' : '↔'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{tx.type}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-slate-900 dark:text-white">{tx.amount} tokens</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{tx.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <p className="text-slate-500 dark:text-slate-400">No credit transactions yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ProjectDetailModal;
