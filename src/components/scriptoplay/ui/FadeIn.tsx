'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'none';
}

export default function FadeIn({ children, delay = 0, className, direction = 'up' }: FadeInProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: direction === 'up' ? 20 : 0,
        scale: 0.98
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
