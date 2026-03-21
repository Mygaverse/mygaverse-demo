import React from 'react';
import { TopTableSection } from "../TopTableSection";
import { PerformanceOverView } from "../PerformanceOverView";
import { PerformanceOverTime } from "../PerformanceOverTime";

interface DashboardWidgetsProps {
  data: {
    metrics: any;
    chartData: any[];
    campaigns: any[];
    adGroups: any[];
    productAds: any[];
    targeting: any[];
    searchTerms: any[];
  };
  currency: string;
  dateRange: string;
  isReportMode?: boolean;
  visibleMetrics: string[];
  onMetricsChange?: (metrics: string[]) => void;
}

export function DashboardWidgets({ 
    data, 
    currency, 
    dateRange, 
    isReportMode = false,
    visibleMetrics,
    onMetricsChange
}: DashboardWidgetsProps) {
  return (
    <>
      {/* 1. Metric Cards (Always visible) */}
      <PerformanceOverView 
        metrics={data.metrics} 
        currency={currency} 
        isReportMode={isReportMode}
        // Pass State
        visibleMetrics={visibleMetrics}
        onMetricsChange={onMetricsChange || (() => {})}
      />
      
      {/* 2. Charts - Pass report mode */}
      <PerformanceOverTime 
        data={data.chartData} 
        dateRange={dateRange} 
        isReportMode={isReportMode} 
      />
      
      {/* 3. Data Tables - Pass report mode */}
      <TopTableSection 
          campaignData={data.campaigns}
          adGroupData={data.adGroups}
          productAdData={data.productAds}
          targetingData={data.targeting}
          searchTermData={data.searchTerms}
          currency={currency}
          isReportMode={isReportMode}
      />
    </>
  );
}