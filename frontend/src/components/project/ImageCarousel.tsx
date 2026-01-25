import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
    images: Array<{
        url: string;
        caption?: string;
        alt: string;
    }>;
    autoScrollInterval?: number;
    height?: string;
    className?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
    images,
    autoScrollInterval = 3000,
    height = 'h-64',
    className = ''
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Auto-scroll logic
    useEffect(() => {
        if (images.length <= 1 || isPaused) return;

        timerRef.current = setInterval(() => {
            nextSlide();
        }, autoScrollInterval);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [images.length, isPaused, autoScrollInterval]);

    if (!images || images.length === 0) return null;

    return (
        <div
            className={`relative group overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 ${height} ${className}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Main Image */}
            <div
                className="w-full h-full flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((img, index) => (
                    <div key={index} className="w-full h-full flex-shrink-0 relative">
                        <img
                            src={img.url}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                        />
                        {img.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm text-center backdrop-blur-sm">
                                {img.caption}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Navigation Arrows (Visible on Hover) */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-700 shadow-lg z-10"
                        aria-label="Previous image"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-700 shadow-lg z-10"
                        aria-label="Next image"
                    >
                        <ChevronRight size={20} />
                    </button>
                </>
            )}

            {/* Indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${currentIndex === index
                                    ? 'bg-white w-4'
                                    : 'bg-white/50 hover:bg-white/80'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageCarousel;
