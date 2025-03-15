'use client';

import { Random } from '@/utils/random';
import { useMemo } from 'react';
import { ReactNode } from 'react';

interface Particle {
    left: string;
    width: string;
    height: string;
    animationDelay: string;
}

interface BannerBackgroundProps {
    children?: ReactNode;
}

export function BannerBackground({ children }: BannerBackgroundProps) {
    const particles = useMemo(() => {
        const random = new Random(123); // Fixed seed for consistent values
        const count = 20;
        const particles: Particle[] = [];

        for (let i = 0; i < count; i++) {
            const size = random.range(10, 40);
            particles.push({
                left: `${random.range(0, 100)}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${random.range(0, 5)}s`,
            });
        }

        return particles;
    }, []); 

    return (
        <div className="relative w-full min-h-[calc(100vh-4rem)] overflow-hidden bg-gray-900">
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((particle, index) => (
                    <div
                        key={index}
                        style={{
                            left: particle.left,
                            width: particle.width,
                            height: particle.height,
                            top: "-20px",
                            animation: "fall 10s linear infinite",
                            animationDelay: particle.animationDelay,
                        }}
                        className="absolute bg-gray-400 opacity-30"
                    />
                ))}
            </div>
            <div className="relative z-10 w-full">
                {children}
            </div>
            <style jsx>{`
                @keyframes fall {
                    0% {
                        transform: translateY(-20px);
                    }
                    100% {
                        transform: translateY(calc(100vh + 40px));
                    }
                }
            `}</style>
        </div>
    );
} 