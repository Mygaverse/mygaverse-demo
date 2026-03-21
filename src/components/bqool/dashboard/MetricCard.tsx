"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "react-bootstrap-icons";

// Define the shape of data passed to this card
export interface MetricCardData {
  id: string;
  title: string;
  value: string; // Already formatted (e.g. "$1,234")
  change: string; // e.g. "+12%"
  isPositive: boolean;
}

interface MetricCardProps {
  data: MetricCardData;
  onRemove?: () => void;
  onMetricChange?: (newMetricId: string) => void;
  availableMetrics?: { id: string; title: string }[];
  isReportMode?: boolean;
}

export const MetricCard = ({ data, onRemove, onMetricChange, availableMetrics, isReportMode = false }: MetricCardProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    if (onMetricChange) onMetricChange(id);
    setIsDropdownOpen(false);
  };

  return (
    <div className={`flex flex-col w-full bg-white rounded-lg overflow-visible border border-[#e2e2e2] relative ${isReportMode ? 'break-inside-avoid' : 'shadow-sm'}`}>
      
      {/* Header */}
      <div className="bg-[#f8f9fa] flex items-stretch border-b border-[#e2e2e2] rounded-t-lg relative min-h-[42px]">
        
        {/* Title Area */}
        <div className="relative flex-1" ref={dropdownRef}>
          {isReportMode ? (
            // REPORT MODE: Static Text
            <div className="w-full h-full flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                <span>{data.title}</span>
            </div>
          ) : (
            // DASHBOARD MODE: Dropdown Trigger
            <>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full h-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#4aaada] hover:bg-gray-50 transition-colors ${onRemove ? 'rounded-tl-lg' : 'rounded-t-lg'}`}
                >
                    <span>{data.title}</span>
                    <ChevronDown size={12} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && availableMetrics && (
                    <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white border border-[#e2e2e2] rounded-md shadow-xl z-50 max-h-[240px] overflow-y-auto">
                    {availableMetrics.map((metric) => (
                        <button
                        key={metric.id}
                        onClick={() => handleSelect(metric.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-[#e2e2e2] last:border-0 ${
                            metric.id === data.id ? "bg-gray-50 font-medium text-[#4aaada]" : "text-gray-700"
                        }`}
                        >
                        {metric.title}
                        </button>
                    ))}
                    </div>
                )}
            </>
          )}
        </div>

        {/* Remove Button (Hide in Report Mode) */}
        {!isReportMode && onRemove && (
          <div className="border-l border-[#e2e2e2]">
            <button 
              onClick={onRemove} 
              className="h-full px-3 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-tr-lg flex items-center justify-center"
              title="Remove Metric"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="text-2xl font-bold text-gray-900 mb-2">{data.value}</div>
        <div className="flex items-center gap-2">
          {/* Note: 'previousValue' logic can be added later if real historical data is available */}
          <span className="text-xs text-gray-400">vs prev. period</span> 
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              data.isPositive
                ? "bg-[rgba(118,181,72,0.2)] text-[#76b548]"
                : "bg-[rgba(253,98,94,0.2)] text-[#fd625e]"
            }`}
          >
            {data.change}
          </span>
        </div>
      </div>
    </div>
  );
};