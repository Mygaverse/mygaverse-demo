'use client';

import React from 'react';
import { Button } from '@/components/bqool/ui/Button';
import { Mortarboard } from 'react-bootstrap-icons';
import { useRouter } from 'next/navigation';

interface BQoolUniversityButtonProps {
    variant?: 'primary' | 'secondary' | 'branding' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export const BQoolUniversityButton: React.FC<BQoolUniversityButtonProps> = ({
    variant = 'branding',
    size = 'md'
}) => {
    const router = useRouter();

    const handleClick = () => {
        router.push('/bqool/v2/university');
    };

    return (
        <Button
            variant={variant}
            size={size}
            icon={<Mortarboard size={18} />}
            onClick={handleClick}
        >
            Learn from BQool University
        </Button>
    );
};
