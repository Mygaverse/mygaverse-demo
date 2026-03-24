'use client';

import React, { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
    speed?: number;
}

export function ParticleBackground({ speed = 1 }: ParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
        let animationFrameId: number;

        const resize = () => {
            canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
            canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
        };

        const createParticles = () => {
            const count = 60; // Increased density
            particles = [];
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 1.5 * speed, // Apply speed multiplier
                    vy: (Math.random() - 0.5) * 1.5 * speed,
                    size: Math.random() * 2 + 1,
                    alpha: Math.random() * 0.5 + 0.2,
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off walls
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        createParticles();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [speed]); // Re-run when speed changes

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
        />
    );
}
