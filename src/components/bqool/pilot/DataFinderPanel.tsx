'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { Plus, Trash, Search, CheckCircleFill } from 'react-bootstrap-icons';

// ─── Constants ────────────────────────────────────────────────
const AD_TYPES = ['Sponsored Products', 'Sponsored Brands', 'Sponsored Display'];

const DATE_RANGES = [
    { label: 'Last 7 Days', value: '7' },
    { label: 'Last 14 Days', value: '14' },
    { label: 'Last 30 Days', value: '30' },
    { label: 'Last 60 Days', value: '60' },
    { label: 'Last 90 Days', value: '90' },
];

const DATA_CATEGORIES = [
    'Campaigns',
    'Ad Groups',
    'Product Ads',
    'Targeting',
    'Search Terms',
    'Goals',
];

const FILTER_FIELDS: Record<string, { label: string; type: 'number' | 'text' }[]> = {
    Campaigns: [{ label: 'Budget', type: 'number' }, { label: 'ACOS', type: 'number' }, { label: 'ROAS', type: 'number' }, { label: 'Spend', type: 'number' }, { label: 'Sales', type: 'number' }, { label: 'Status', type: 'text' }],
    'Ad Groups': [{ label: 'Default Bid', type: 'number' }, { label: 'ACOS', type: 'number' }, { label: 'Spend', type: 'number' }],
    'Product Ads': [{ label: 'ACOS', type: 'number' }, { label: 'Sales', type: 'number' }, { label: 'Status', type: 'text' }],
    Targeting: [{ label: 'Bid', type: 'number' }, { label: 'ACOS', type: 'number' }, { label: 'CPC', type: 'number' }],
    'Search Terms': [{ label: 'Impressions', type: 'number' }, { label: 'Clicks', type: 'number' }, { label: 'ACOS', type: 'number' }],
    Goals: [{ label: 'ACOS', type: 'number' }, { label: 'Sales', type: 'number' }],
};

const OPERATORS_NUM = ['>', '<', '>=', '<=', '='];
const OPERATORS_TXT = ['is', 'is not', 'contains'];

// ─── Types ────────────────────────────────────────────────────
interface FilterRow {
    id: number;
    field: string;
    operator: string;
    value: string;
}

interface DataFinderPanelProps {
    onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────
export function DataFinderPanel({ onClose }: DataFinderPanelProps) {
    const { user } = useAuth();

    // Context selectors
    const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
    const [selectedStore, setSelectedStore] = useState('');
    const [adType, setAdType] = useState(AD_TYPES[0]);
    const [dateRange, setDateRange] = useState('30');
    const [category, setCategory] = useState(DATA_CATEGORIES[0]);

    // Filters
    const [filters, setFilters] = useState<FilterRow[]>([]);
    const nextId = React.useRef(0);

    // Keyword
    const [keyword, setKeyword] = useState('');

    // Result state
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load stores from Firestore
    useEffect(() => {
        if (!user) return;
        const fetchStores = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'stores'), where('userId', '==', user.uid)));
                const list = snap.docs.map(d => ({ id: d.id, name: d.data().name || d.data().storeName || d.id }));
                setStores(list);
                if (list.length > 0) setSelectedStore(list[0].id);
            } catch { /* ignore */ }
        };
        fetchStores();
    }, [user]);

    // Available filter fields for current category
    const fieldDefs = FILTER_FIELDS[category] || [];

    const addFilter = () => {
        const firstField = fieldDefs[0]?.label || '';
        const firstOp = fieldDefs[0]?.type === 'number' ? '>' : 'is';
        setFilters(prev => [...prev, { id: nextId.current++, field: firstField, operator: firstOp, value: '' }]);
    };

    const removeFilter = (id: number) => setFilters(prev => prev.filter(f => f.id !== id));

    const updateFilter = (id: number, patch: Partial<FilterRow>) => {
        setFilters(prev => prev.map(f => {
            if (f.id !== id) return f;
            const updated = { ...f, ...patch };
            // Reset operator if field type changes
            if (patch.field) {
                const def = fieldDefs.find(d => d.label === patch.field);
                updated.operator = def?.type === 'number' ? '>' : 'is';
                updated.value = '';
            }
            return updated;
        }));
    };

    // Reset filters when category changes
    useEffect(() => { setFilters([]); }, [category]);

    const canSubmit = selectedStore || keyword.trim() || filters.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        // Simulate async AI search (replace with real Gemini call later)
        await new Promise(r => setTimeout(r, 1200));
        setLoading(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="shrink-0 px-4 py-3 border-b border-gray-100 bg-purple-50 flex items-center justify-between">
                    <span className="text-sm font-bold text-purple-800">Data Finder</span>
                    <button onClick={() => { setSubmitted(false); setKeyword(''); setFilters([]); }}
                        className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-100 transition-colors">
                        New Search
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                        <CheckCircleFill size={16} className="shrink-0" />
                        <span className="text-sm font-medium">Search complete — results coming soon</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 text-xs text-gray-600">
                        <div><span className="font-semibold text-gray-700">Store:</span> {stores.find(s => s.id === selectedStore)?.name || 'All'}</div>
                        <div><span className="font-semibold text-gray-700">Ad Type:</span> {adType}</div>
                        <div><span className="font-semibold text-gray-700">Date Range:</span> Last {dateRange} days</div>
                        <div><span className="font-semibold text-gray-700">Category:</span> {category}</div>
                        {filters.length > 0 && (
                            <div><span className="font-semibold text-gray-700">Filters:</span> {filters.map(f => `${f.field} ${f.operator} ${f.value}`).join(', ')}</div>
                        )}
                        {keyword && <div><span className="font-semibold text-gray-700">Keyword:</span> {keyword}</div>}
                    </div>
                    <p className="text-xs text-gray-400 italic">AI-powered result display coming in next update.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Sub-header */}
            <div className="shrink-0 px-4 py-3 border-b border-gray-100 bg-purple-50 flex items-center justify-between">
                <span className="text-sm font-bold text-purple-800">Data Finder</span>
                <button onClick={onClose}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                    Cancel
                </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-4 space-y-4">

                    {/* ── Store Selector ── */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Store</label>
                        <select
                            value={selectedStore}
                            onChange={e => setSelectedStore(e.target.value)}
                            className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-all"
                        >
                            <option value="">All Stores</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* ── Ad Type + Date Range (2-col) ── */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Ad Type</label>
                            <select
                                value={adType}
                                onChange={e => setAdType(e.target.value)}
                                className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-all"
                            >
                                {AD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Date Range</label>
                            <select
                                value={dateRange}
                                onChange={e => setDateRange(e.target.value)}
                                className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-all"
                            >
                                {DATE_RANGES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* ── Data Category ── */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Data Category</label>
                        <div className="flex flex-wrap gap-1.5">
                            {DATA_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${category === cat
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Filters ── */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Filters</label>
                            <button
                                type="button"
                                onClick={addFilter}
                                disabled={fieldDefs.length === 0}
                                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Plus size={14} /> Add Filter
                            </button>
                        </div>

                        {filters.length === 0 ? (
                            <div className="text-xs text-gray-400 italic py-2">No filters — click Add Filter to narrow results.</div>
                        ) : (
                            <div className="space-y-2">
                                {filters.map(f => {
                                    const def = fieldDefs.find(d => d.label === f.field);
                                    const ops = def?.type === 'number' ? OPERATORS_NUM : OPERATORS_TXT;
                                    return (
                                        <div key={f.id} className="flex items-center gap-1.5">
                                            {/* Field */}
                                            <select
                                                value={f.field}
                                                onChange={e => updateFilter(f.id, { field: e.target.value })}
                                                className="flex-1 h-8 px-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-purple-400"
                                            >
                                                {fieldDefs.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                                            </select>
                                            {/* Operator */}
                                            <select
                                                value={f.operator}
                                                onChange={e => updateFilter(f.id, { operator: e.target.value })}
                                                className="w-16 h-8 px-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-purple-400"
                                            >
                                                {ops.map(op => <option key={op} value={op}>{op}</option>)}
                                            </select>
                                            {/* Value */}
                                            <input
                                                type={def?.type === 'number' ? 'number' : 'text'}
                                                value={f.value}
                                                onChange={e => updateFilter(f.id, { value: e.target.value })}
                                                placeholder="Value"
                                                className="flex-1 h-8 px-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-purple-400"
                                            />
                                            {/* Remove */}
                                            <button type="button" onClick={() => removeFilter(f.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                                                <Trash size={13} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Keyword ── */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Keyword / Question</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                placeholder="e.g. campaigns with high ACOS but good CVR..."
                                className="w-full pl-3 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-all"
                            />
                            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                        </div>
                    </div>

                    {/* ── Submit ── */}
                    <button
                        type="submit"
                        disabled={!canSubmit || loading}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search size={15} />
                                Find Data
                            </>
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
}
