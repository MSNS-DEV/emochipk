'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CategorySlideshowProps {
  images: string[];
  fallbackUrl: string;
  alt: string;
}

export function CategorySlideshow({ images, fallbackUrl, alt }: CategorySlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback to static image if no array provided or it's empty
  const displayImages = images?.length > 0 ? images : [fallbackUrl];

  useEffect(() => {
    if (displayImages.length <= 1) return;

    // Change image every 3 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [displayImages.length]);

  return (
    <>
      {displayImages.map((src, index) => (
        <Image
          key={`${src}-${index}`}
          src={src}
          alt={`${alt} image ${index + 1}`}
          fill
          className={`object-cover transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          sizes="(min-width: 768px) 33vw, 50vw"
        />
      ))}
    </>
  );
}
