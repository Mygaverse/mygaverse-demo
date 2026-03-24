"use client";

import { ChevronRight, Search, Filter, Eye, CameraVideo, ChevronDown, Trash, Pencil, FileEarmarkPdf } from "react-bootstrap-icons";
import { useState, useEffect, useMemo } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/bqool/firebase";
import { useAuth } from "@/app/bqool/context/AuthContext";

import { TopTableSection, Report } from "./TopTableSection";
import { PerformanceOverView } from "./PerformanceOverView";
import { PerformanceOverTime, TabData } from "./PerformanceOverTime";
import { DashboardWidgets } from "./reports/DashboardWidgets";

// UI Components
import { StoreSelector } from "../ui/StoreSelector";
import { SingleSelect } from "../ui/SingleSelect";
import { Button } from "../ui/Button";
// Modals
import { CurrencyRateModal } from '@/components/bqool/ui/CurrencyRateModal';
import { CustomFilterModal, FilterSelection } from '@/components/bqool/ui/CustomFilterModal';
import { PreviewReportModal } from '@/components/bqool/ui/PreviewReportModal';
import { ReportPreviewModal } from '@/components/bqool/dashboard/reports/ReportPreviewModal';

function Breadcrumb() {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className="text-lg font-medium">Advertising</span>
      <ChevronRight size={16} />
      <span className="text-sm">Dashboard</span>
    </div>
  );
}

export function DashboardContent() {
  const { user } = useAuth();

  // --- 1. FILTER STATE ---
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [adType, setAdType] = useState('All');
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  
  // Custom Filters
  const [currentSelection, setCurrentSelection] = useState<string[]>([]); 
  const [favorites, setFavorites] = useState<FilterSelection[]>([]);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);

  // EDIT STATE for Filter Modal
  const [filterToEdit, setFilterToEdit] = useState<FilterSelection | null>(null);

  // UI State
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isFavDropdownOpen, setIsFavDropdownOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // State for Report Mode
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  // --- DATA STATE ---
  const [rawCampaigns, setRawCampaigns] = useState<any[]>([]);
  const [rawAdGroups, setRawAdGroups] = useState<any[]>([]);
  const [rawProductAds, setRawProductAds] = useState<any[]>([]);
  const [rawTargeting, setRawTargeting] = useState<any[]>([]);
  const [rawSearchTerms, setRawSearchTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [visibleMetrics, setVisibleMetrics] = useState<string[]>([
    "totalSales", "spend", "sales", "acos"
  ]);

  // Lifted state for Reports and Chart Tabs
  const [reports, setReports] = useState<Report[]>([
    { id: '1', type: 'Top 5', metric: 'Ad Sales' },
  ]);
  const [activeReportId, setActiveReportId] = useState('1');
  const [chartTabs, setChartTabs] = useState<TabData[]>([
    { id: 'fixed-1', metric1: 'Ad Sales', metric2: 'Ad Spend' },
    { id: 'fixed-2', metric1: 'Ad Orders', metric2: 'ACOS' },
    { id: 'fixed-3', metric1: 'Ad Spend', metric2: 'Impressions' },
  ]);
  const [activeChartTabId, setActiveChartTabId] = useState('fixed-1');

  // --- 2. INITIALIZATION ---
  useEffect(() => {
    const initDefaultStore = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().defaultStoreId) {
          setSelectedStoreIds([userDoc.data().defaultStoreId]);
        }
      } catch (error) { console.error(error); }
    };
    initDefaultStore();
  }, [user]);

  // --- 3. DATA FETCHING (Parallel) ---
  useEffect(() => {
    const fetchData = async () => {
      if (!user || selectedStoreIds.length === 0) { setLoading(false); return; }
      setLoading(true);
      
      const stores = selectedStoreIds.slice(0, 10); // Firestore 'in' limit

      try {
        const [campSnap, agSnap, padSnap, targSnap, stSnap] = await Promise.all([
            getDocs(query(collection(db, 'campaigns'), where('storeId', 'in', stores))),
            getDocs(query(collection(db, 'ad_groups'), where('storeId', 'in', stores))),
            getDocs(query(collection(db, 'product_ads'), where('storeId', 'in', stores))),
            getDocs(query(collection(db, 'targeting'), where('storeId', 'in', stores))),
            getDocs(query(collection(db, 'search_terms'), where('storeId', 'in', stores))),
        ]);

        setRawCampaigns(campSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setRawAdGroups(agSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setRawProductAds(padSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setRawTargeting(targSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setRawSearchTerms(stSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [user, selectedStoreIds]);

  // --- 4. DATA PROCESSING ---
  const dashboardData = useMemo(() => {
    // Helper: Filter by Ad Type & Selection
    const filterData = (data: any[]) => {
        let filtered = data;
        if (adType !== 'All') {
            const typeMap: Record<string, string> = { 'Sponsored Products': 'SP', 'Sponsored Brands': 'SB', 'Sponsored Display': 'SD' };
            // Note: Different collections might use different field names for type (e.g. 'campaignType' vs 'type')
            // This is a simplified check assuming consistent data structure or 'type'/'campaignType'
            const dbType = typeMap[adType];
            if (dbType) filtered = filtered.filter(item => item.type === dbType || item.campaignType === dbType);
        }
        // Custom selection currently applies to Campaign IDs. 
        // For sub-entities, we check their 'campaignId'.
        if (currentSelection.length > 0) {
            filtered = filtered.filter(item => 
                currentSelection.includes(item.id) || // If filtering campaigns
                currentSelection.includes(item.campaignId) // If filtering sub-entities
            );
        }
        return filtered;
    };

    // Helper: Apply Date Scaling
    let factor = 1.0;
    let days = 30;
    if (dateRange.includes('7')) { factor = 0.12; days = 7; }
    else if (dateRange.includes('14')) { factor = 0.25; days = 14; }
    else if (dateRange.includes('30')) { factor = 0.5; days = 30; }
    else if (dateRange.includes('60')) { factor = 1.0; days = 60; }
    else if (dateRange.includes('Year')) { factor = 2.5; days = 90; }

    const processMetrics = (data: any[]) => {
        return data.map(item => {
            const sales = (item.sales || 0) * factor;
            const spend = (item.spend || 0) * factor;
            const impressions = Math.round((item.impressions || 0) * factor);
            const clicks = Math.round((item.clicks || 0) * factor);
            const orders = Math.round((item.orders || 0) * factor);
            // Units: fallback to orders if units are missing in raw data
            const units = Math.round((item.units || item.orders || 0) * factor);
            
            return {
                ...item,
                sales, spend, impressions, clicks, orders, units,
                // Recalc Ratios
                acos: sales > 0 ? (spend / sales) * 100 : 0,
                roas: spend > 0 ? sales / spend : 0,
                ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                cpc: clicks > 0 ? spend / clicks : 0,
                cvr: clicks > 0 ? (orders / clicks) * 100 : 0
            };
        });
    };

    // Process All Lists
    const procCampaigns = processMetrics(filterData(rawCampaigns));
    const procAdGroups = processMetrics(filterData(rawAdGroups));
    const procProductAds = processMetrics(filterData(rawProductAds));
    const procTargeting = processMetrics(filterData(rawTargeting));
    const procSearchTerms = processMetrics(filterData(rawSearchTerms));

    // Aggregate Dashboard Totals (From Campaigns is safest)
    const totals = procCampaigns.reduce((acc, curr) => ({
        sales: acc.sales + curr.sales,
        spend: acc.spend + curr.spend,
        impressions: acc.impressions + curr.impressions,
        clicks: acc.clicks + curr.clicks,
        orders: acc.orders + curr.orders,
        units: acc.units + curr.units,
    }), { sales: 0, spend: 0, impressions: 0, clicks: 0, orders: 0, units: 0 });

    const acos = totals.sales > 0 ? (totals.spend / totals.sales) * 100 : 0;
    const roas = totals.spend > 0 ? totals.sales / totals.spend : 0;
    const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const cvr = totals.clicks > 0 ? (totals.orders / totals.clicks) * 100 : 0;

    // Simulate Total Sales & Total ACOS 
    const totalSales = totals.sales * 2.8; // Assuming Ad Sales is ~35% of Total Sales
    const totalAcos = totalSales > 0 ? (totals.spend / totalSales) * 100 : 0;

    // Generate Chart Data
    const chartData = Array.from({ length: days }).map((_, i) => {
        const dayFactor = (Math.random() * 0.5 + 0.75) / days; 

        // Base values
        const daySales = totals.sales * dayFactor;
        const daySpend = totals.spend * dayFactor;
        const dayClicks = totals.clicks * dayFactor;
        const dayOrders = totals.orders * dayFactor;

        // Calculated values for the chart
        const dayTotalSales = daySales * 2.8; // Simulating Total Sales

        return {
            date: new Date(Date.now() - (days - 1 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: totals.sales * dayFactor,
            spend: totals.spend * dayFactor,
            orders: totals.orders * dayFactor,
            impressions: totals.impressions * dayFactor,
            clicks: totals.clicks * dayFactor,
            units: totals.units * dayFactor,

            // Ratios
            acos: (Math.random() * 15 + acos - 7),
            roas: (Math.random() * 2 + roas - 1),
            totalSales: dayTotalSales,
            totalAcos: dayTotalSales > 0 ? (daySpend / dayTotalSales) * 100 : 0,
            cvr: dayClicks > 0 ? (dayOrders / dayClicks) * 100 : 0,
            ctr: (Math.random() * 0.5 + ctr - 0.2),
            cpc: dayClicks > 0 ? daySpend / dayClicks : 0 
        };
    });

    return {
        metrics: { 
            ...totals, 
            acos, 
            roas, 
            cpc, 
            ctr, 
            cvr, 
            totalSales, 
            totalAcos 
        },
        chartData,
        // Entity Lists
        campaigns: procCampaigns,
        adGroups: procAdGroups,
        productAds: procProductAds,
        targeting: procTargeting,
        searchTerms: procSearchTerms,
        goals: []
    };
  }, [rawCampaigns, rawAdGroups, rawProductAds, rawTargeting, rawSearchTerms, adType, dateRange, currentSelection]);

  // --- HANDLERS ---
  const handleCurrencyChange = (value: string) => value === 'View Rate' ? setIsCurrencyModalOpen(true) : setSelectedCurrency(value);

  // 1. APPLY (Temporary)
  const handleApply = (selectedIds: string[]) => {
      setCurrentSelection(selectedIds);
      setActiveFavoriteId(null);
      setIsFilterModalOpen(false);
  };

  // 2. SAVE / UPDATE FAVORITE
  const handleSaveFavorite = (name: string, ids: string[], type: 'Campaign'|'ASIN') => {
    if (filterToEdit) {
        // UPDATE EXISTING
        const updatedFavorites = favorites.map(f => f.id === filterToEdit.id ? { ...f, name, items: ids, type } : f);
        setFavorites(updatedFavorites);
        setActiveFavoriteId(filterToEdit.id); // Keep it active
    } else {
        // CREATE NEW
        const newFav: FilterSelection = { id: Date.now().toString(), name, items: ids, type };
        setFavorites([...favorites, newFav]); 
        setActiveFavoriteId(newFav.id);
    }
    setCurrentSelection(ids); // Apply immediately
    setFilterToEdit(null); // Clear edit mode
  };

  // 3. DROPDOWN ACTIONS
  const handleSelectFavorite = (fav: FilterSelection) => {
    setActiveFavoriteId(fav.id); setCurrentSelection(fav.items); setIsFavDropdownOpen(false);
  };

  const handleEditFavorite = (e: React.MouseEvent, fav: FilterSelection) => {
      e.stopPropagation();
      setFilterToEdit(fav);
      setIsFavDropdownOpen(false);
      setIsFilterModalOpen(true);
  };

  const handleDeleteFavorite = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setFavorites(favorites.filter(f => f.id !== id));
      // RESET LOGIC: If deleted active, reset to original state
      if (activeFavoriteId === id) {
          setActiveFavoriteId(null);
          setCurrentSelection([]);
      }
  };

  const handleOpenFilterModal = () => {
      setFilterToEdit(null); // Clear edit state for new filter
      setIsFilterModalOpen(true);
  }

  const getCustomFilterLabel = () => currentSelection.length > 0 ? `Campaign (${currentSelection.length})` : 'Custom Filters';

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
      <div className="flex items-center justify-between">
        <Breadcrumb />
        <Button variant="branding" size="sm" icon={<CameraVideo size={16} />}>Learn</Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
         <div className="flex items-center shadow-sm rounded-md h-[48px]">
            <StoreSelector mode="multiple" selectedStoreIds={selectedStoreIds} onSelect={setSelectedStoreIds} />
            <SingleSelect label="Ad Type" value={adType} options={['All', 'Sponsored Products', 'Sponsored Brands', 'Sponsored Display']} onChange={setAdType} width="w-[180px]" />
            <SingleSelect label="Currency" value={selectedCurrency} options={['USD', 'CAD', 'EUR', 'GBP', 'View Rate']} onChange={handleCurrencyChange} width="w-[100px]" />
            <SingleSelect label="Date" value={dateRange} options={['Last 7 days', 'Last 14 days','Last 30 days', 'Last 60 days', 'Year to Date']} onChange={setDateRange} width="w-[160px]" />
            <button className="h-[48px] w-[48px] bg-[#4aaada] flex items-center justify-center hover:bg-[#3a9aca] border border-[#4aaada] rounded-r-md">
                <Search className="text-white" size={20} />
            </button>
         </div>
         
         <div className="flex items-center flex-1 min-w-[300px] relative">
            <button 
              onClick={handleOpenFilterModal} 
              className={`h-[48px] px-4 border rounded-l-md flex items-center gap-2 transition-colors ${currentSelection.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <Filter size={16} className={currentSelection.length > 0 ? "text-blue-600" : "text-[#4aaada]"} /> 
                <span className="whitespace-nowrap font-medium">{getCustomFilterLabel()}</span>
            </button>

            <div className="relative flex-1">
              <button onClick={() => setIsFavDropdownOpen(!isFavDropdownOpen)} disabled={favorites.length === 0} className={`h-[48px] px-4 border-y border-r rounded-r-md flex items-center text-sm w-full transition-colors ${favorites.length === 0 ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'}`}>
                <span className="truncate">{activeFavoriteId ? favorites.find(f => f.id === activeFavoriteId)?.name : 'Favorite Filter'}</span> 
                <ChevronDown size={14} className="ml-auto" />
              </button>
              {isFavDropdownOpen && favorites.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {favorites.map(fav => (
                    <div key={fav.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer group" onClick={() => handleSelectFavorite(fav)}>
                      <span className="text-sm text-gray-700 font-medium">{fav.name}</span>
                      <div className="flex gap-2">
                        <button className="text-gray-400 hover:text-[#4aaada]" onClick={(e) => handleEditFavorite(e, fav)}>
                            <Pencil size={14} />
                        </button>
                        <button className="text-gray-600 hover:text-red-600" onClick={(e) => handleDeleteFavorite(e, fav.id)}>
                          <Trash size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
         </div>
         <Button variant="secondary" size="lg" onClick={() => setIsReportOpen(true)} icon={<Eye size={16}/>} hideTextOnMobile={true} className="ml-auto">Preview Report</Button>
      </div>

      {/* Dashboard Content Grid */}
      {/* Note: To show content in BOTH dashboard and report without re-rendering logic, 
          For simplicity, I will render the `ReportPreviewModal` and pass the components inside it.
      */}

      {/* Main Dashboard Display (Visible normally) */}
      <div className="flex flex-col gap-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">Loading Dashboard Data...</div> 
          ) : (
            /* Pass data to the extracted component */
            <DashboardWidgets
                data={dashboardData}
                currency={selectedCurrency}
                dateRange={dateRange}
                visibleMetrics={visibleMetrics}
                onMetricsChange={setVisibleMetrics}
                reports={reports}
                activeReportId={activeReportId}
                onReportChange={setActiveReportId}
                onReportsChange={setReports}
                chartTabs={chartTabs}
                activeChartTabId={activeChartTabId}
                onChartTabChange={setActiveChartTabId}
                onChartTabsChange={setChartTabs}
            />
          )}
      </div>

      {/* REPORT MODAL */}
      {isReportOpen && (
          <ReportPreviewModal
              isOpen={isReportOpen}
              onClose={() => setIsReportOpen(false)}
              dateRange={dateRange}
              adType={adType}
              selectedStoreIds={selectedStoreIds}
          >
              {/* Pass the SAME component to reuse layout & data */}
              <div className="flex flex-col gap-6 pointer-events-none"> 
                  <DashboardWidgets
                      data={dashboardData}
                      currency={selectedCurrency}
                      dateRange={dateRange}
                      isReportMode={true}
                      visibleMetrics={visibleMetrics}
                      onMetricsChange={setVisibleMetrics}
                      reports={reports}
                      activeReportId={activeReportId}
                      onReportChange={setActiveReportId}
                      onReportsChange={setReports}
                      chartTabs={chartTabs}
                      activeChartTabId={activeChartTabId}
                      onChartTabChange={setActiveChartTabId}
                      onChartTabsChange={setChartTabs}
                  />
              </div>
          </ReportPreviewModal>
      )}

      <CustomFilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        onApply={setCurrentSelection} 
        onSaveFavorite={handleSaveFavorite} 
        filterToEdit={filterToEdit}
      />
      <PreviewReportModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} onUpgrade={() => setIsPreviewOpen(false)} />
      <CurrencyRateModal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} />
    </div>
  );
}