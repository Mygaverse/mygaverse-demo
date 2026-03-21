'use client';

interface ClickableNumberCellProps {
  value: number | string;
  onClick: () => void;
}

export const ClickableNumberCell = ({ value, onClick }: ClickableNumberCellProps) => (
  <button 
    onClick={onClick}
    className="text-[#0066b7] hover:underline font-medium text-sm leading-none"
  >
    {value}
  </button>
);