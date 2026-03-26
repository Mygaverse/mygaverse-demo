"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

const ParticleBackground = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // MORE PARTICLES: Increased from 25 to 50
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // 0-100% width
      y: Math.random() * 100, // 0-100% height
      
      // LARGER PARTICLES: Size between 2px and 6px (was 1-4px)
      size: Math.random() * 4 + 2, 
      
      // FASTER MOTION: Duration between 5-12s (was 10-20s)
      duration: Math.random() * 7 + 5, 
      
      delay: Math.random() * 3, // Reduced delay for quicker starts
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/60" // Increased opacity from bg-white to bg-white/60
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          // ENHANCED ANIMATION: More dramatic movement
          animate={{
            y: [0, -150, 0], // Larger vertical movement (was -100)
            x: [0, Math.sin(particle.id) * 50, 0], // Added subtle horizontal drift
            opacity: [0, 0.8, 0], // Higher peak opacity (was 0.4)
            scale: [1, 1.2, 1], // Slight scale pulsing for more life
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleBackground;