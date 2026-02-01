import React, { useState, useCallback } from 'react';
import { Modal, ModalFooter } from '../ui';
import Button from '../common/Button';
import { uploadService } from '../../services/api';
import toast from 'react-hot-toast';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: string; // Optional now
    onUploadComplete: (documents: any[]) => void;
    minImages?: number;
}

interface UploadedImage {
    id: string; // internal id
    file: File;
    preview: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    ipfsHash?: string;
    documentId?: string; // Backend ID
    progress?: number;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
    isOpen,
    onClose,
    projectId,
    onUploadComplete,
    minImages = 1,
}) => {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        addFiles(files);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            addFiles(files);
        }
    };

    const addFiles = (files: File[]) => {
        const newImages: UploadedImage[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            status: 'pending' as const,
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = async (id: string) => {
        const image = images.find(img => img.id === id);

        // If it was already uploaded, delete from server
        if (image?.status === 'success' && image.documentId) {
            try {
                await uploadService.deleteFile(image.documentId);
                toast.success('Image removed');
            } catch (err) {
                console.error("Failed to remove image", err);
                // remove from UI anyway
            }
        }

        if (image) {
            URL.revokeObjectURL(image.preview);
        }

        setImages(prev => prev.filter(img => img.id !== id));
    };

    const uploadImages = async () => {
        if (images.length < minImages) {
            toast.error(`Please add at least ${minImages} image(s)`);
            return;
        }

        setIsUploading(true);
        // We'll return full document objects including IDs
        const uploadedDocs: any[] = [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            if (image.status === 'success') {
                if (image.documentId) {
                    uploadedDocs.push({
                        ipfsHash: image.ipfsHash,
                        id: image.documentId,
                        documentType: 'IMAGE'
                    });
                }
                continue;
            }

            setImages(prev =>
                prev.map(img =>
                    img.id === image.id ? { ...img, status: 'uploading' as const } : img
                )
            );

            try {
                // Pass undefined projectId if not available
                const result = await uploadService.uploadFile(image.file, projectId || undefined, 'IMAGE');

                const documentId = result.file?.id;
                const ipfsHash = result.file?.ipfsHash;

                setImages(prev =>
                    prev.map(img =>
                        img.id === image.id
                            ? { ...img, status: 'success' as const, ipfsHash, documentId }
                            : img
                    )
                );
                uploadedDocs.push(result.file);
            } catch (error) {
                setImages(prev =>
                    prev.map(img =>
                        img.id === image.id ? { ...img, status: 'error' as const } : img
                    )
                );
                toast.error(`Failed to upload ${image.file.name}`);
            }
        }

        setIsUploading(false);

        const successCount = images.filter(img => img.status === 'success').length; // Re-calculate based on current state (some might have failed)

        if (successCount >= minImages) {
            toast.success('Images uploaded successfully!');
            onUploadComplete(uploadedDocs);
        }
    };

    const successCount = images.filter(img => img.status === 'success').length;
    const canProceed = successCount >= minImages || images.length >= minImages;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload Project Images" size="lg">
            <div className="space-y-6">
                {/* Info banner */}
                <div className="p-4 rounded-lg bg-ocean-50 dark:bg-ocean-900/20 border border-ocean-200 dark:border-ocean-800">
                    <p className="text-sm text-ocean-700 dark:text-ocean-300">
                        Upload at least {minImages} image(s) of your project site. These will be stored on IPFS for permanent verification.
                    </p>
                </div>

                {/* Drop zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
                            ? 'border-ocean-500 bg-ocean-50 dark:bg-ocean-900/20'
                            : 'border-slate-300 dark:border-slate-600 hover:border-ocean-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }
          `}
                >
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-full bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center">
                            <svg className="w-8 h-8 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-slate-100 font-medium">
                                Drop images here or click to browse
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                PNG, JPG, WEBP up to 10MB each
                            </p>
                        </div>
                    </div>
                </div>

                {/* Image previews */}
                {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {images.map(image => (
                            <div
                                key={image.id}
                                className="relative group rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square"
                            >
                                <img
                                    src={image.preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />

                                {/* Status overlay */}
                                <div className={`
                  absolute inset-0 flex items-center justify-center
                  ${image.status === 'uploading' ? 'bg-slate-900/60' : ''}
                  ${image.status === 'success' ? 'bg-kelp-500/20' : ''}
                  ${image.status === 'error' ? 'bg-red-500/20' : ''}
                `}>
                                    {image.status === 'uploading' && (
                                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {image.status === 'success' && (
                                        <div className="w-10 h-10 rounded-full bg-kelp-500 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                    {image.status === 'error' && (
                                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Remove button */}
                                {image.status !== 'uploading' && (
                                    <button
                                        onClick={() => removeImage(image.id)}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}

                                {/* IPFS hash badge */}
                                {image.ipfsHash && (
                                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-slate-900/80 rounded text-xs text-white truncate">
                                        IPFS: {image.ipfsHash.slice(0, 12)}...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload count info */}
                {images.length > 0 && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        {successCount} of {images.length} uploaded
                        {successCount < minImages && ` (minimum ${minImages} required)`}
                    </div>
                )}
            </div>

            <ModalFooter>
                <Button variant="ghost" onClick={onClose} disabled={isUploading}>
                    Cancel
                </Button>
                <Button
                    onClick={uploadImages}
                    loading={isUploading}
                    disabled={!canProceed}
                >
                    {successCount >= minImages ? 'Done' : 'Upload Images'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ImageUploadModal;
