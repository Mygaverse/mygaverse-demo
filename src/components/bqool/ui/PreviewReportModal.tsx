'use client';

import React from 'react';
import { ArrowUp } from 'react-bootstrap-icons';
import { Modal } from '@/components/bqool/ui/Modal'; // Adjust path as needed
import { Button } from '@/components/bqool/ui/Button'; // Adjust path as needed
// You'll need to save the illustration from image_8.png as an SVG or image file
const PremiumIllustration = { src: '/upgrade-illustration.svg' };

interface PreviewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const PreviewReportModal = ({ isOpen, onClose, onUpgrade }: PreviewReportModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preview Report"
      headerStyle="branding"
      width="max-w-lg" // Adjust width as needed for the content
    >
      <div className="flex flex-col items-center text-center p-6">
        {/* 1. Illustration */}
        <div className="mb-6">
          <img 
            src={PremiumIllustration.src} 
            alt="Premium Features Illustration" 
            width={300} 
            height={180}
            className="w-auto h-auto" // Ensure it scales
          />
        </div>

        {/* 2. Title & Description */}
        <h3 className="text-xl font-bold text-[#4aaada] mb-3">
          Get Premium Features
        </h3>
        <p className="text-gray-600 mb-8 max-w-sm">
          Upgrade to the $299 or higher plan to unlock premium features.
        </p>

        {/* 3. Footer Actions */}
        <div className="flex gap-3 w-full justify-center">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onUpgrade} variant='primary'
            icon={<ArrowUp size={16} />}
          >
            Upgrade
          </Button>
        </div>
      </div>
    </Modal>
  );
};