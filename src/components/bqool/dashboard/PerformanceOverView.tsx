"use client";

import { useState, useRef, useEffect } from "react";
import { PlusCircleFill } from "react-bootstrap-icons";
import { MetricCard } from "./MetricCard";
import { Button } from "../ui/Button";

// Initial list of available metrics to choose from
const AVAILABLE_METRICS = [
  { id: "totalSales", title: "Total Sales", type: "currency" },
  { id: "sales", title: "Ad Sales", type: "currency" },
  { id: "spend", title: "Ad Spend", type: "currency" },
  { id: "totalAcos", title: "Total ACOS", type: "percent" },
  { id: "acos", title: "ACOS", type: "percent" },
  { id: "roas", title: "ROAS", type: "number" },
  { id: "orders", title: "Ad Orders", type: "integer" },
  { id: "units", title: "Ad Units Sold", type: "integer" },
  { id: "cvr", title: "CVR", type: "percent" },
  { id: "impressions", title: "Impressions", type: "integer" },
  { id: "clicks", title: "Clicks", type: "integer" },
  { id: "ctr", title: "CTR", type: "percent" },
  { id: "cpc", title: "CPC", type: "currency" },
];

interface PerformanceOverViewProps {
  metrics: any; // The aggregated metrics object from DashboardContent
  currency: string;
  isReportMode?: boolean;
  visibleMetrics: string[]; 
  onMetricsChange: (metrics: string[]) => void;
}

export const PerformanceOverView = ({ 
    metrics, 
    currency, 
    isReportMode = false,
    visibleMetrics,      // Received from parent
    onMetricsChange      // Callback to parent
}: PerformanceOverViewProps) => {

  /* Default visible metrics
  const [visibleMetricIds, setVisibleMetricIds] = useState<string[]>([
    "totalSales", "sales", "spend", "acos"
  ]);
  */

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ACTIONS ---
  const addMetric = (id: string) => {
    if (!visibleMetrics.includes(id) && visibleMetrics.length < 12) {
      onMetricsChange([...visibleMetrics, id]); // Call parent
      setIsAddMenuOpen(false);
    }
  };

  const removeMetricAtIndex = (index: number) => {
    onMetricsChange(visibleMetrics.filter((_, i) => i !== index)); // Call parent
  };

  const changeMetricAtIndex = (index: number, newId: string) => {
    const newMetrics = [...visibleMetrics];
    newMetrics[index] = newId;
    onMetricsChange(newMetrics); // Call parent
  };

  // --- FORMATTER ---
  const formatValue = (value: number, type: string) => {
    if (value === undefined || value === null) return "-";
    
    // Get Currency Symbol
    const symbols: Record<string, string> = { 'USD': '$', 'CAD': 'CA$', 'EUR': '€', 'GBP': '£' };
    const sym = symbols[currency] || '$';

    switch (type) {
        case 'currency': return `${sym}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'percent': return `${value.toFixed(2)}%`;
        case 'integer': return value.toLocaleString();
        case 'number': return value.toFixed(2);
        default: return value.toString();
    }
  };

  return (
    <div className={`bg-white rounded-lg ${isReportMode ? '' : 'border border-[#e2e2e2] mb-6 p-6'}`}>

      {/* Header */}
      {!isReportMode && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[18px] font-medium text-gray-900">Performance Overview</h2>
          
          {/* Add Button */}
          <div className="relative" ref={addMenuRef}>
            <Button
              variant="secondaryIcon"
              size="icon"
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              disabled={visibleMetrics.length >= 12}
            >
              <PlusCircleFill size={16} className="text-[#4aaada]"/>
            </Button>

            {isAddMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-[200px] bg-white border border-[#e2e2e2] rounded-md shadow-xl z-50 max-h-[300px] overflow-y-auto">
                <div className="p-2 text-xs font-bold text-gray-400 uppercase border-b border-[#e2e2e2]">Add Metric</div>
                {AVAILABLE_METRICS.map((m) => {
                  const isSelected = visibleMetrics.includes(m.id);
                  return (
                      <button
                      key={m.id}
                      onClick={() => addMetric(m.id)}
                      disabled={isSelected}
                      className={`w-full text-left px-4 py-2.5 text-sm border-b border-[#e2e2e2] last:border-0 ${isSelected ? 'text-gray-400 bg-gray-50 cursor-default' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                      {m.title}
                      </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleMetrics.map((metricId, index) => {
          const config = AVAILABLE_METRICS.find(m => m.id === metricId);
          if (!config) return null;

          // Hydrate with REAL data
          const rawValue = metrics[metricId];
          const displayValue = formatValue(rawValue, config.type);
          
          // Hydrate mock "change" data (since we don't have historical comparison yet)
          // In a real app, calculate % change from previous period here.
          const mockChange = (Math.random() * 20 - 5).toFixed(1) + "%";
          const isPos = !mockChange.startsWith('-');

          const cardData = {
              ...config,
              value: displayValue,
              change: mockChange,
              isPositive: isPos
          };

          const isRemovable = index >= 4;

          return (
            <MetricCard
              key={`${metricId}-${index}`}
              data={cardData}
              onRemove={isRemovable ? () => removeMetricAtIndex(index) : undefined}
              onMetricChange={(newId) => changeMetricAtIndex(index, newId)}
              availableMetrics={AVAILABLE_METRICS}
              isReportMode={isReportMode}
            />
          );
        })}
      </div>
    </div>
  );
};