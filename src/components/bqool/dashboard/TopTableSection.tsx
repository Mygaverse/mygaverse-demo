'use client';

import React, { useState, useMemo } from 'react';
import { Pencil, X, Trash, Check, PlusCircleFill, ChevronDown, LayoutThreeColumns, Files } from 'react-bootstrap-icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

// --- Types ---
export interface Report {
    id: string;
    type: string;
    metric: string;
    isEditing?: boolean;
}

interface TopTableSectionProps {
    campaignData: any[];
    adGroupData: any[];
    productAdData: any[];
    targetingData: any[];
    searchTermData: any[];
    goalData?: any[];
    currency: string;
    isReportMode?: boolean;
    // Lifted State
    reports: Report[];
    activeReportId: string;
    onReportChange: (id: string) => void;
    onReportsChange: (reports: Report[]) => void;
}

// ... CONSTANTS ...
const TABS = ['Campaigns', 'Ad Groups', 'Product Ads', 'Targeting', 'Search Terms', 'Goals'];
const REPORT_TYPES = ['Top 5', 'Top 10', 'Bottom 5', 'Bottom 10'];
const REPORT_METRICS = ['Ad Sales', 'Ad Spend', 'ACOS', 'ROAS', 'Impressions', 'Clicks'];
const METRIC_HEADERS = ['Ad Sales', 'Ad Spend', 'ACOS', 'ROAS', 'Ad Orders', 'CVR', 'Impressions', 'Clicks', 'CTR', 'CPC'];

export const TopTableSection = ({
    campaignData, adGroupData, productAdData, targetingData, searchTermData, goalData = [], currency, isReportMode = false,
    reports, activeReportId, onReportChange, onReportsChange
}: TopTableSectionProps) => {
    const [activeTab, setActiveTab] = useState('Campaigns');

    // Edit/Add State
    const [editType, setEditType] = useState('Top 5');
    const [editMetric, setEditMetric] = useState('Ad Sales');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newType, setNewType] = useState('Top 5');
    const [newMetric, setNewMetric] = useState('Ad Sales');

    // --- Helper Functions ---
    const formatVal = (val: number, type: 'currency' | 'percent' | 'number' | 'int') => {
        if (val === undefined || val === null) return '-';
        const sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : currency === 'CAD' ? 'CA$' : '$';
        switch (type) {
            case 'currency': return `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            case 'percent': return `${val.toFixed(2)}%`;
            case 'int': return Math.round(val).toLocaleString();
            case 'number': return val.toFixed(2);
        }
    };

    // --- CORE DATA LOGIC (Extracted for reuse) ---
    const getTableDataForReport = (reportType: string, metric: string, tabName: string) => {
        let source: any[] = [];
        switch (tabName) {
            case 'Campaigns': source = campaignData; break;
            case 'Ad Groups': source = adGroupData; break;
            case 'Product Ads': source = productAdData; break;
            case 'Targeting': source = targetingData; break;
            case 'Search Terms': source = searchTermData; break;
            case 'Goals': source = goalData || []; break;
        }

        if (source.length === 0) return [];

        const keyMap: Record<string, string> = {
            'Ad Sales': 'sales', 'Ad Spend': 'spend', 'ACOS': 'acos', 'ROAS': 'roas',
            'Impressions': 'impressions', 'Clicks': 'clicks'
        };

        const sortKey = keyMap[metric] || 'sales';

        const sorted = [...source].sort((a, b) => {
            const valA = a[sortKey] || 0;
            const valB = b[sortKey] || 0;
            return reportType.includes('Top') ? valB - valA : valA - valB;
        });

        const limit = reportType.includes('10') ? 10 : 5;
        return sorted.slice(0, limit).map((item, idx) => ({ ...item, rank: idx + 1 }));
    };

    const currentReport = reports.find(r => r.id === activeReportId) || reports[0];

    const activeTableData = useMemo(() => {
        const r = reports.find(r => r.id === activeReportId) || reports[0];
        return getTableDataForReport(r.type, r.metric, activeTab);
    }, [activeTab, campaignData, adGroupData, productAdData, targetingData, searchTermData, goalData, activeReportId, reports]);

    // --- Render Entity Info Helper ---
    const renderEntityInfo = (row: any, tab: string) => {
        if (tab === 'Product Ads') {
            return (
                <div className="flex items-start gap-3">
                    <img src={row.productImage || "https://placehold.co/40x40?text=Prod"} alt="product" className="w-10 h-10 rounded border border-gray-200 object-cover" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-[#0066b7] font-medium truncate max-w-[240px]" title={row.productName}>{row.productName || 'Product Name'}</span>
                        <div className="text-xs text-gray-500 flex gap-2">
                            <span className="font-medium">{row.asin || 'ASIN'}</span>
                            <span>SKU: {row.sku || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="flag" iconStr={`https://flagcdn.com/w20/${row.flag || 'us'}.png`}>{row.storeName}</Badge>
                            <Badge variant={row.enabled ? 'status-enabled' : 'status-paused'}>{row.enabled ? 'Enabled' : 'Paused'}</Badge>
                        </div>
                    </div>
                </div>
            );
        }
        if (tab === 'Targeting' || tab === 'Search Terms') {
            const text = row.targetingText || row.searchTerm || row.text;
            return (
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[280px]" title={text}>{text}</span>
                    <div className="flex items-center gap-2">
                        <Badge variant="flag" iconStr={`https://flagcdn.com/w20/${row.flag || 'us'}.png`}>{row.storeName}</Badge>
                        {row.matchType && <Badge variant="neutral">{row.matchType}</Badge>}
                    </div>
                </div>
            );
        }
        return (
            <div className="flex flex-col gap-1">
                <span className="text-sm text-[#0066b7] font-medium truncate max-w-[280px]" title={row.name}>{row.name || 'Unknown'}</span>
                <div className="flex items-center gap-2">
                    <Badge variant="flag" iconStr={`https://flagcdn.com/w20/${row.flag || 'us'}.png`}>{row.storeName}</Badge>
                    {tab === 'Campaigns' && <Badge variant="neutral">{row.type || 'SP'}</Badge>}
                    <Badge variant={row.enabled ? 'status-enabled' : 'status-paused'}>{row.enabled ? 'Enabled' : 'Paused'}</Badge>
                </div>
            </div>
        );
    }

    // --- Handlers (Add/Edit/Remove) ---
    const handleAddReport = () => { if (reports.length >= 10) return; const r = { id: Date.now().toString(), type: newType, metric: newMetric, isEditing: true }; onReportsChange([...reports, r]); onReportChange(r.id); setIsAddingNew(false); };
    const handleRemoveReport = (e: any, id: string) => { e.stopPropagation(); if (reports.length <= 1) return; const f = reports.filter(r => r.id !== id); onReportsChange(f); if (id === activeReportId && f.length > 0) onReportChange(f[0].id); };
    const handleEditClick = (e: any, r: Report) => { e.stopPropagation(); setEditType(r.type); setEditMetric(r.metric); onReportsChange(reports.map(rep => rep.id === r.id ? { ...rep, isEditing: true } : { ...rep, isEditing: false })); onReportChange(r.id); };
    const handleSaveEdit = (e: any, id: string) => { e.stopPropagation(); onReportsChange(reports.map(r => r.id === id ? { ...r, type: editType, metric: editMetric, isEditing: false } : r)); };
    const EditForm = ({ reportId }: { reportId: string }) => (
        <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
            <div className="flex gap-2"><select className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full bg-white text-gray-700" value={editType} onChange={(e) => setEditType(e.target.value)}>{REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select><select className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full bg-white text-gray-700" value={editMetric} onChange={(e) => setEditMetric(e.target.value)}>{REPORT_METRICS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div className="flex gap-2 justify-end"><button onClick={(e) => { e.stopPropagation(); onReportsChange(reports.map(r => r.id === reportId ? { ...r, isEditing: false } : r)) }} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 text-gray-600"><X size={14} /></button><button onClick={(e) => handleSaveEdit(e, reportId)} className="w-6 h-6 flex items-center justify-center bg-[#4aaada] rounded hover:bg-[#3a9aca] text-white"><Check size={14} /></button></div>
        </div>
    );

    // --- SUB-COMPONENT: Single Table Instance ---
    const TableInstance = ({ reportType, metric, tabName }: { reportType: string, metric: string, tabName: string }) => {
        const data = getTableDataForReport(reportType, metric, tabName);

        return (
            <div className="flex-1 flex flex-col min-w-0 bg-white p-6 border border-[#e2e2e2] rounded-lg mb-6 break-inside-avoid">
                <div className="flex justify-between items-center mb-4">
                    <div><h3 className="text-base font-bold text-gray-800">{reportType} {tabName} by {metric}</h3>
                        <p className="text-xs text-gray-400 mt-1">Data Range Applied</p></div>
                </div>
                <div className="flex-1 overflow-auto relative border border-[#e2e2e2] rounded-lg">
                    <table className="w-full border-separate border-spacing-0">
                        <thead className="bg-[#f8f9fa] z-20">
                            <tr>
                                <th className="sticky left-0 top-0 z-30 bg-[#f8f9fa] border-b border-r border-[#e2e2e2] px-4 py-3 text-center text-xs font-semibold text-gray-500 w-[60px]">Rank</th>
                                <th className="sticky left-[60px] top-0 z-30 bg-[#f8f9fa] border-b border-r border-[#e2e2e2] px-4 py-3 text-left text-xs font-semibold text-gray-500 min-w-[320px]">{tabName}</th>
                                {METRIC_HEADERS.map((header) => <th key={header} className="sticky top-0 z-20 bg-[#f8f9fa] border-b border-r border-[#e2e2e2] px-4 py-3 text-right text-xs font-semibold text-gray-500 min-w-[100px] whitespace-nowrap">{header}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {data.length === 0 ? <tr><td colSpan={12} className="text-center py-10 text-gray-400">No data found</td></tr> :
                                data.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 group">
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-900 font-medium text-center">{row.rank}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 align-top">{renderEntityInfo(row, tabName)}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-700 text-right align-top">{formatVal(row.sales, 'currency')}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-700 text-right align-top">{formatVal(row.spend, 'currency')}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-700 text-right align-top">{formatVal(row.acos, 'percent')}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-700 text-right align-top">{formatVal(row.roas, 'number')}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-700 text-right align-top">{formatVal(row.orders, 'int')}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-700 text-right align-top">{formatVal(row.cvr, 'percent')}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-700 text-right align-top">{formatVal(row.impressions, 'int')}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-700 text-right align-top">{formatVal(row.clicks, 'int')}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-700 text-right align-top">{formatVal(row.ctr, 'percent')}</td>
                                        <td className="border-b border-r border-[#e2e2e2] px-4 py-3 text-sm text-gray-700 text-right align-top">{formatVal(row.cpc, 'currency')}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className={`bg-white rounded-lg ${isReportMode ? '' : 'border border-[#e2e2e2] flex flex-col mb-10 overflow-hidden h-[650px]'}`}>

            {/* 1. Header Section (Hidden in Report Mode) */}
            {!isReportMode && (
                <div className="p-6 pb-0">
                    <div className="flex items-center gap-3 mb-6 w-full">
                        <div className="flex-1 flex items-center border border-[#e2e2e2] rounded-md overflow-hidden h-[42px]">
                            {TABS.map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 h-full text-sm text-center relative transition-colors font-medium border-r border-[#e2e2e2] last:border-r-0 ${activeTab === tab ? 'text-[#212529] bg-gray-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}>
                                    {tab}
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4aaada]" />}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex-shrink-0">
                            <Tooltip content="This feature is currenly not avaliable for demo" position="left">
                                <div className="cursor-not-allowed opacity-50">
                                    <Button variant="secondaryIcon" size="icon" disabled>
                                        <PlusCircleFill className="text-[#4aaada]" size={16} />
                                    </Button>
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Main Content Area */}
            <div className={`flex flex-1 ${isReportMode ? 'flex-col' : 'border-t border-[#e2e2e2] overflow-hidden'}`}>

                {/* Left Sidebar (Report Manager) - HIDDEN IN REPORT MODE */}
                {!isReportMode && (
                    <div className="w-[280px] flex-shrink-0 border-r border-[#e2e2e2] flex flex-col bg-white">
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {reports.map((report) => (
                                <div key={report.id} onClick={() => !report.isEditing && onReportChange(report.id)} className={`relative transition-all cursor-pointer py-3 px-3 border-l-4 ${activeReportId === report.id ? 'border-[#4aaada] bg-[#f8f9fa]' : 'border-transparent hover:bg-gray-50'}`}>
                                    {report.isEditing ? <EditForm reportId={report.id} /> : (
                                        <div className="flex justify-between items-start group">
                                            <div className="flex flex-col"><span className={`text-sm ${activeReportId === report.id ? 'font-medium text-[#4aaada]' : 'text-gray-800'}`}>{report.type} {activeTab}</span><span className="text-xs text-gray-500">by {report.metric}</span></div>
                                            <div className="flex items-center gap-1 transition-opacity"><button onClick={(e) => handleEditClick(e, report)} className="p-1 text-gray-400 hover:text-[#4aaada]"><Pencil size={12} /></button>{reports.length > 1 && <button onClick={(e) => handleRemoveReport(e, report.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash size={12} /></button>}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isAddingNew ? (
                                <div className="p-3 border border-dashed border-[#4aaada] rounded-lg bg-[#f1f7ff]">
                                    <div className="space-y-2">
                                        <select className="w-full text-sm border border-gray-300 rounded p-1.5" value={newType} onChange={(e) => setNewType(e.target.value)}>{REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                        <select className="w-full text-sm border border-gray-300 rounded p-1.5" value={newMetric} onChange={(e) => setNewMetric(e.target.value)}>{REPORT_METRICS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                        <div className="flex gap-2 mt-2"><button onClick={handleAddReport} className="flex-1 bg-[#4aaada] text-white text-xs py-1.5 rounded">Add</button><button onClick={() => setIsAddingNew(false)} className="flex-1 bg-gray-200 text-gray-600 text-xs py-1.5 rounded">Cancel</button></div>
                                    </div>
                                </div>
                            ) : <Button size='lg' variant='ghostOutline' fullWidth onClick={() => setIsAddingNew(true)} icon={<PlusCircleFill size={16} className='text-[#4aaada]' />} disabled={reports.length >= 10}>Add Report</Button>}
                        </div>
                    </div>
                )}

                {/* Right Content / Report View */}
                {isReportMode ? (
                    <div className="flex flex-col gap-6">
                        {TABS.map(tabName => (
                            <TableInstance
                                key={tabName}
                                reportType={currentReport.type}
                                metric={currentReport.metric}
                                tabName={tabName}
                            />
                        ))}
                    </div>
                ) : (
                    <TableInstance
                        reportType={currentReport.type}
                        metric={currentReport.metric}
                        tabName={activeTab}
                    />
                )}
            </div>
        </div>
    );
};
