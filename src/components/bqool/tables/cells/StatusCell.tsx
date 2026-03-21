'use client';
import { Toggle } from "../../ui/Toggle";
import { Badge } from "../../ui/Badge";
import { InfoCircleFill } from "react-bootstrap-icons"; // Using Bootstrap icons per your project

interface StatusCellProps {
  isEnabled: boolean;
  statusLabel?: string; 
  onToggle: (newVal: boolean) => void;
  isArchived?: boolean; // New prop for the specific Archived state
}

export const StatusCell = ({ isEnabled, statusLabel, onToggle, isArchived }: StatusCellProps) => (
  <div 
    className="flex flex-col items-center gap-2"
    // CRITICAL: Stop propagation here so clicking anywhere in this cell doesn't select the row
    onClick={(e) => e.stopPropagation()} 
  >
    {isArchived ? (
       // Archived State: Switch OFF + Tooltip Icon
       <div className="group relative flex items-center justify-center">
          <Toggle checked={false} onChange={() => {}} disabled={true} className="opacity-50 cursor-not-allowed" />
          
          {/* Tooltip Trigger */}
          <div className="absolute -right-4 top-0 text-gray-400">
             <InfoCircleFill size={12} />
          </div>

          {/* Tooltip Content */}
          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
            Archived
          </div>
       </div>
    ) : (
       // Normal State
       <Toggle checked={isEnabled} onChange={onToggle} />
    )}
    
    {statusLabel && (
        <Badge variant={statusLabel === 'Advanced' ? 'status-enabled' : 'neutral'}>
            {statusLabel}
        </Badge>
    )}
  </div>
);