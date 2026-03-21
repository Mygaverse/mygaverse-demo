'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PlusCircleFill, Pencil, X, Check, ChevronDown } from 'react-bootstrap-icons';
import { PerformanceChart } from './PerformanceChart';
import { Button } from '../ui/Button';

// --- CONSTANTS ---
const METRIC_MAP: Record<string, string> = {
  'Total Sales': 'totalSales',
  'Ad Sales': 'sales',
  'Ad Spend': 'spend',
  'Total ACOS': 'totalAcos',
  'ACOS': 'acos',
  'ROAS': 'roas',
  'Ad Orders': 'orders',
  'Ad Units Sold': 'units',
  'CVR': 'cvr',
  'Impressions': 'impressions',
  'Clicks': 'clicks',
  'CTR': 'ctr',
  'CPC': 'cpc'
};
const AVAILABLE_METRICS = Object.keys(METRIC_MAP);

interface TabData { id: string; metric1: string; metric2: string; }
const INITIAL_TABS: TabData[] = [
  { id: 'fixed-1', metric1: 'Ad Sales', metric2: 'Ad Spend' },
  { id: 'fixed-2', metric1: 'Ad Orders', metric2: 'ACOS' },
  { id: 'fixed-3', metric1: 'Ad Spend', metric2: 'Impressions' },
];

interface PerformanceOverTimeProps { 
    data: any[]; 
    dateRange: string;
    isReportMode?: boolean; // NEW PROP
}

export const PerformanceOverTime = ({ data, dateRange, isReportMode = false }: PerformanceOverTimeProps) => {
  const [tabs, setTabs] = useState<TabData[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState('fixed-1');
  const [customTabId, setCustomTabId] = useState<string | null>(null);

  // --- INDEPENDENT STATE FOR ADD vs EDIT ---
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addComp1, setAddComp1] = useState('Ad Sales');
  const [addComp2, setAddComp2] = useState('Ad Spend');
  const addMenuRef = useRef<HTMLDivElement>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editComp1, setEditComp1] = useState('Ad Sales');
  const [editComp2, setEditComp2] = useState('Ad Spend');
  const editMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setIsAddOpen(false);
        if (editMenuRef.current && !editMenuRef.current.contains(e.target as Node)) setIsEditOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- ACTIONS ---
  const handleAddConfirm = () => {
      if (addComp1 === addComp2) return;
      const newId = 'custom-' + Date.now();
      const newTab = { id: newId, metric1: addComp1, metric2: addComp2 };
      if (customTabId) setTabs(prev => prev.map(t => t.id === customTabId ? newTab : t));
      else { setTabs(prev => [...prev, newTab]); setCustomTabId(newId); }
      setActiveTabId(newId); setIsAddOpen(false);
  };

  const openEditMode = () => {
      const currentTab = tabs.find(t => t.id === activeTabId);
      if (currentTab) { setEditComp1(currentTab.metric1); setEditComp2(currentTab.metric2); setIsEditOpen(true); }
  };

  const handleEditConfirm = () => {
      if (editComp1 === editComp2) return;
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, metric1: editComp1, metric2: editComp2 } : t));
      setIsEditOpen(false);
  };

  const handleRemoveCustomTab = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setTabs(prev => prev.filter(t => t.id !== id));
      if (activeTabId === id) setActiveTabId(INITIAL_TABS[0].id);
      setCustomTabId(null);
  };

  // --- HELPER: Calculate Data for a specific tab config ---
  const getChartData = (m1: string, m2: string) => {
      const key1 = METRIC_MAP[m1];
      const key2 = METRIC_MAP[m2];
      return {
          labels: data.map(d => d.date),
          data1: data.map(d => d[key1] || 0),
          data2: data.map(d => d[key2] || 0),
          total1: data.reduce((acc, curr) => acc + (curr[key1] || 0), 0),
          total2: data.reduce((acc, curr) => acc + (curr[key2] || 0), 0),
          key1, key2
      };
  };

  const formatVal = (val: number, key: string) => {
      // 1. Currency
      if (['sales', 'spend', 'cpc', 'totalSales'].includes(key)) {
          return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      
      // 2. Percentages (ACOS, CTR, CVR, Total ACOS)
      // Note: Chart summary sums daily values. For ratios, we display the average of the data points for the legend.
      if (['acos', 'ctr', 'cvr', 'totalAcos'].includes(key)) {
          const avg = val / (data.length || 1);
          return `${avg.toFixed(2)}%`; 
      }

      // 3. ROAS (Number)
      if (key === 'roas') {
          const avg = val / (data.length || 1);
          return avg.toFixed(2);
      }

      // 4. Integers (Orders, Units, Impressions, Clicks)
      return Math.round(val).toLocaleString();
  };

  // --- SUB-COMPONENT: Single Chart View ---
  const ChartInstance = ({ tabData, isInteractive }: { tabData: TabData, isInteractive: boolean }) => {
      const cData = getChartData(tabData.metric1, tabData.metric2);
      
      return (
        <div className="border border-[#e2e2e2] rounded-lg p-6 mb-6 last:mb-0 break-inside-avoid">
            <div className="flex justify-between items-start mb-6">
                <div className="relative" ref={isInteractive ? editMenuRef : null}>
                    {isInteractive && isEditOpen && activeTabId === tabData.id ? (
                        <div className="absolute top-[-8px] left-[-8px] z-50">
                            {/* Dropdown component code... reused below */}
                             <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-lg border border-gray-200">
                                <select value={editComp1} onChange={e=>setEditComp1(e.target.value)} className="border p-1 rounded text-sm">{AVAILABLE_METRICS.map(m=><option key={m}>{m}</option>)}</select>
                                <span>vs</span>
                                <select value={editComp2} onChange={e=>setEditComp2(e.target.value)} className="border p-1 rounded text-sm">{AVAILABLE_METRICS.map(m=><option key={m}>{m}</option>)}</select>
                                <button onClick={handleEditConfirm}><Check/></button>
                                <button onClick={()=>setIsEditOpen(false)}><X/></button>
                             </div>
                        </div>
                    ) : (
                        <div className={`flex items-center gap-2 group ${isInteractive ? 'cursor-pointer' : ''}`} onClick={isInteractive ? openEditMode : undefined}>
                            <h3 className={`text-base font-medium text-gray-900 ${isInteractive ? 'border-b border-dashed border-gray-300 hover:border-gray-500' : ''}`}>
                                {tabData.metric1} vs {tabData.metric2}
                            </h3>
                            {isInteractive && <Pencil size={12} className="text-gray-600 transition-opacity" />}
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{dateRange}</p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-[#5e72e4]"></span>
                        <span className="text-gray-600 text-xs w-20 text-right">{tabData.metric1}</span>
                        <span className="font-bold text-gray-900">{formatVal(cData.total1, cData.key1)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-gray-100 px-2 py-1 rounded">
                        <span className="w-2 h-2 rounded-full bg-[#f5365c]"></span>
                        <span className="text-gray-600 text-xs w-20 text-right">{tabData.metric2}</span>
                        <span className="font-bold text-gray-900">{formatVal(cData.total2, cData.key2)}</span>
                    </div>
                </div>
            </div>
            <div className="h-[350px] w-full">
                <PerformanceChart 
                    labels={cData.labels}
                    data1={cData.data1}
                    data2={cData.data2}
                    label1={tabData.metric1}
                    label2={tabData.metric2}
                />
            </div>
        </div>
      );
  };

  const VSDropdownRow = ({ val1, setVal1, val2, setVal2, onConfirm, onClose }: any) => (
      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-lg border border-gray-200 animate-in fade-in zoom-in-95 duration-100 min-w-[320px]">
          <div className="relative flex-1"><select value={val1} onChange={e => setVal1(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded py-1 pl-2 pr-6 focus:outline-none focus:border-blue-500 cursor-pointer">{AVAILABLE_METRICS.map(m => <option key={m} value={m}>{m}</option>)}</select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={10} /></div>
          <span className="text-gray-400 text-sm font-medium">vs</span>
          <div className="relative flex-1"><select value={val2} onChange={e => setVal2(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded py-1 pl-2 pr-6 focus:outline-none focus:border-blue-500 cursor-pointer">{AVAILABLE_METRICS.map(m => <option key={m} value={m}>{m}</option>)}</select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={10} /></div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"><X size={16} /></button>
          <button onClick={onConfirm} className="p-1.5 rounded bg-[#4aaada] text-white hover:bg-[#3a9aca] transition-colors shadow-sm shrink-0"><Check size={16} /></button>
      </div>
  );

  return (
    <div className={`bg-white rounded-lg ${isReportMode ? '' : 'border border-[#e2e2e2] mb-6'}`}>
      <div className={isReportMode ? '' : 'p-6'}>
        {!isReportMode && <h2 className="text-[18px] font-medium text-gray-900 mb-4">Performance Over Time</h2>}
        
        {/* TABS ROW (Hidden in Report Mode) */}
        {!isReportMode && (
            <div className="flex items-center gap-3 mb-6 w-full">
                <div className="flex-1 flex items-center border border-[#e2e2e2] rounded-md overflow-hidden h-[42px]">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTabId(tab.id)} className={`flex-1 h-full text-sm text-center relative transition-colors font-medium border-r border-[#e2e2e2] last:border-0 flex items-center justify-center gap-2 px-2 ${activeTabId === tab.id ? 'text-[#212529] bg-gray-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}>
                            <span className="truncate">{tab.metric1} vs {tab.metric2}</span>
                            {tab.id === customTabId && <span onClick={(e) => handleRemoveCustomTab(e, tab.id)} className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></span>}
                            {activeTabId === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4aaada]" />}
                        </button>
                    ))}
                    {tabs.length < 4 && <div className="flex-1 h-full bg-[#fafafa]" />}
                </div>
                <div className="relative flex-shrink-0" ref={addMenuRef}>
                    <Button variant="secondaryIcon" size="icon" onClick={() => { if(!customTabId) setIsAddOpen(!isAddOpen); }} disabled={!!customTabId}><PlusCircleFill className="text-[#4aaada]" size={16} /></Button>
                    {isAddOpen && <div className="absolute top-full right-0 mt-2 z-50"><VSDropdownRow val1={addComp1} setVal1={setAddComp1} val2={addComp2} setVal2={setAddComp2} onConfirm={handleAddConfirm} onClose={() => setIsAddOpen(false)} /></div>}
                </div>
            </div>
        )}

        {/* CONTENT */}
        {isReportMode ? (
            // REPORT MODE: Render ALL tabs vertically
            <div className="flex flex-col gap-6">
                {tabs.map(tab => (
                    <ChartInstance key={tab.id} tabData={tab} isInteractive={false} />
                ))}
            </div>
        ) : (
            // DASHBOARD MODE: Render ONLY active tab
            <ChartInstance tabData={tabs.find(t => t.id === activeTabId) || tabs[0]} isInteractive={true} />
        )}
      </div>
    </div>
  );
};