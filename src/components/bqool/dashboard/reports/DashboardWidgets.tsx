import { TopTableSection, Report } from "../TopTableSection";
import { PerformanceOverView } from "../PerformanceOverView";
import { PerformanceOverTime, TabData } from "../PerformanceOverTime";

interface DashboardWidgetsProps {
  data: {
    metrics: any;
    chartData: any[];
    campaigns: any[];
    adGroups: any[];
    productAds: any[];
    targeting: any[];
    searchTerms: any[];
    goals: any[];
  };
  currency: string;
  dateRange: string;
  isReportMode?: boolean;
  visibleMetrics: string[];
  onMetricsChange?: (metrics: string[]) => void;
  // Chart Props
  chartTabs: TabData[];
  activeChartTabId?: string;
  onChartTabChange: (id: string) => void;
  onChartTabsChange: (tabs: TabData[]) => void;
  // Table Props
  reports: Report[];
  activeReportId: string;
  onReportChange: (id: string) => void;
  onReportsChange: (reports: Report[]) => void;
}

export function DashboardWidgets({
  data,
  currency,
  dateRange,
  isReportMode = false,
  visibleMetrics,
  onMetricsChange,
  // Chart
  chartTabs, activeChartTabId, onChartTabChange, onChartTabsChange,
  // Table
  reports, activeReportId, onReportChange, onReportsChange
}: DashboardWidgetsProps) {
  return (
    <>
      {/* 1. Metric Cards (Always visible) */}
      <PerformanceOverView
        metrics={data.metrics}
        currency={currency}
        isReportMode={isReportMode}
        visibleMetrics={visibleMetrics}
        onMetricsChange={onMetricsChange || (() => { })}
      />

      {/* 2. Charts - Pass report mode and lifted state */}
      <PerformanceOverTime
        data={data.chartData}
        dateRange={dateRange}
        isReportMode={isReportMode}
        tabs={chartTabs}
        activeTabId={activeChartTabId}
        onTabChange={onChartTabChange}
        onTabsChange={onChartTabsChange}
      />

      {/* 3. Data Tables - Pass report mode and lifted state */}
      <TopTableSection
        campaignData={data.campaigns}
        adGroupData={data.adGroups}
        productAdData={data.productAds}
        targetingData={data.targeting}
        searchTermData={data.searchTerms}
        goalData={data.goals}
        currency={currency}
        isReportMode={isReportMode}
        reports={reports}
        activeReportId={activeReportId}
        onReportChange={onReportChange}
        onReportsChange={onReportsChange}
      />
    </>
  );
}
