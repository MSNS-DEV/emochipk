'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface CategorySlideshowProps {
  images: string[];
  fallbackUrl: string;
  alt: string;
}

export function CategorySlideshow({ images, fallbackUrl, alt }: CategorySlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Deterministic base images for SSR & initial hydration to prevent mismatch errors
  const baseImages = useMemo(() => {
    const uniqueImages = Array.from(new Set((images || []).filter(Boolean)));
    return (uniqueImages.length > 0 ? uniqueImages : [fallbackUrl]).slice(0, 10);
  }, [images, fallbackUrl]);

  const [shuffledImages, setShuffledImages] = useState<string[] | null>(null);

  // Client-side shuffle post-hydration so every visit experiences variety
  useEffect(() => {
    if (baseImages.length <= 1) return;
    const shuffled = [...baseImages];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledImages(shuffled);
  }, [baseImages]);

  const displayImages = shuffledImages ?? baseImages;

  useEffect(() => {
    if (displayImages.length <= 1) return;

    // Change image every 3.5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [displayImages.length]);

  return (
    <>
      {displayImages.map((src, index) => {
        const isCurrent = index === currentIndex;
        const isNext = index === (currentIndex + 1) % displayImages.length;
        if (!isCurrent && !isNext) return null;

        return (
          <Image
            key={`${src}-${index}`}
            src={src}
            alt={`${alt} image ${index + 1}`}
            fill
            className={`object-cover transition-opacity duration-1000 ${
              isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            sizes="(min-width: 768px) 33vw, 50vw"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        );
      })}
    </>
  );
}
