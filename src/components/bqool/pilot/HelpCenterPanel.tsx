'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, ArrowLeft, CheckCircleFill } from 'react-bootstrap-icons';

// ─── Q&A Data ────────────────────────────────────────────────────────────────
interface QA { q: string; a: string }
interface Category { id: string; label: string; qas: QA[] }

const CATEGORIES: Category[] = [
    {
        id: 'popular', label: 'Popular',
        qas: [
            { q: 'How do I connect my Amazon account?', a: 'Go to Settings → Connections, click "Connect Amazon Account", and follow the Amazon Seller Central authorization flow. Permissions are read-only by default.' },
            { q: 'What does ACOS mean?', a: 'ACOS (Advertising Cost of Sales) = Ad Spend ÷ Ad Revenue × 100. A lower ACOS means you\'re spending less to generate each dollar of revenue. Target ACOS depends on your product margin.' },
            { q: 'How does AI Bidding work?', a: 'AI Bidding monitors your campaign performance every few hours and adjusts keyword/target bids up or down to hit your ACOS or ROAS goal. It uses a rule-based model enhanced with historical performance signals.' },
            { q: 'How do I set up Auto-Harvesting?', a: 'In Ad Manager → Search Terms, select high-converting search terms and use "Add as Keyword" or "Add as Target". Auto-Harvesting automates this on a schedule you configure in Settings.' },
            { q: 'Why are my campaigns not spending?', a: 'Common reasons: budget exhausted, bids too low to win impressions, targeting too narrow, or campaign/ad group is paused. Check each level in Ad Manager and raise budgets or bids incrementally.' },
            { q: 'Can I manage multiple stores?', a: 'Yes. Add each store under Settings → Stores. You can switch between stores using the store selector at the top of the dashboard, or aggregate data across all stores in the Portfolio view.' },
        ],
    },
    {
        id: 'ai_bidding', label: 'AI Bidding',
        qas: [
            { q: 'How often does AI Bidding adjust my bids?', a: 'AI Bidding runs every 2–4 hours by default. You can change the frequency in Settings → AI Bidding → Schedule.' },
            { q: 'What ACOS target should I set?', a: 'A good starting point is your product\'s break-even ACOS = (profit margin %). If your margin is 30%, set target ACOS ≤ 30% to ensure profitability.' },
            { q: 'Can I exclude certain keywords from AI Bidding?', a: 'Yes. Open the campaign or keyword, toggle "AI Bidding Enabled" off for that specific keyword. AI Bidding will skip it while still optimizing the rest.' },
            { q: 'What is ROAS Optimization mode?', a: 'Instead of targeting a specific ACOS, ROAS mode maximizes return per dollar spent. Useful for products with variable margins or when top-line revenue growth is the priority.' },
            { q: 'Why did AI Bidding raise my bid on a keyword with high ACOS?', a: 'It may have detected improving CVR or increasing search traffic that historically converts at different times. Review the Bidding History in Ad History tab for the full audit trail.' },
        ],
    },
    {
        id: 'auto_harvesting', label: 'Auto-Harvesting',
        qas: [
            { q: 'What is Auto-Harvesting?', a: 'Auto-Harvesting scans your Search Terms report and automatically promotes high-converting search terms into your targeted keywords or product targets, reducing manual work.' },
            { q: 'How do I set a minimum order threshold for harvesting?', a: 'Go to Settings → Auto-Harvesting → Thresholds. Set minimum orders, minimum clicks, and maximum ACOS before a term is harvested.' },
            { q: 'Can I harvest negative keywords too?', a: 'Yes. Set a "Negative Harvest" rule: terms with zero orders above a click threshold can automatically be added as negative exact or negative phrase keywords.' },
            { q: 'Where can I see what was harvested?', a: 'Navigate to Ad History → Harvesting History. Each harvested term shows the source campaign, the action taken, and the date.' },
        ],
    },
    {
        id: 'budget_manager', label: 'Budget Manager',
        qas: [
            { q: 'How do I prevent my budget from running out early in the day?', a: 'Enable "Daily Budget Smoothing" in Budget Manager. This distributes your daily budget evenly across all hours, preventing early depletion common on high-traffic mornings.' },
            { q: 'What is a Budget Group?', a: 'A Budget Group lets you assign a shared daily or monthly budget cap across multiple campaigns. Useful for brand campaigns that need to stay within a combined ceiling.' },
            { q: 'Can I set seasonal budget multipliers?', a: 'Yes. Budget Rules let you set date-based multipliers (e.g. ×1.5 during Prime Day) that automatically increase or decrease budgets for that period.' },
            { q: 'How is "Estimated Budget Depletion" calculated?', a: 'It projects your current daily spend rate against your remaining daily budget and estimates the time the budget will be fully consumed, assuming the same hourly rate.' },
        ],
    },
    {
        id: 'campaign_builder', label: 'Campaign Builder',
        qas: [
            { q: 'What campaign types can I create?', a: 'You can create Sponsored Products (SP), Sponsored Brands (SB), and Sponsored Display (SD) campaigns. Each type has its own ad group and targeting configuration.' },
            { q: 'What is a Goal in Campaign Builder?', a: 'A Goal ties one or more campaigns together under a strategic objective (e.g. "Q1 Launch - Widget Pro"). It tracks combined metrics so you can measure the goal\'s total performance.' },
            { q: 'What is the "Basic" strategy?', a: 'Basic creates one auto-targeting ad group and one manual keyword ad group, giving a balanced starting point for a new product with minimal configuration.' },
            { q: 'Can I duplicate an existing campaign structure?', a: 'Not yet via the UI — this is planned. You can export your campaign data and re-import via Amazon Bulk Operations in the meantime.' },
        ],
    },
    {
        id: 'dashboard', label: 'Dashboard',
        qas: [
            { q: 'How do I customize the Dashboard metrics?', a: 'Click the ⚙ icon on any metric card to change the KPI displayed. You can also drag and drop cards to reorder them.' },
            { q: 'What date ranges are available in the Dashboard?', a: 'Last 7, 14, 30, 60, and 90 days. Custom date ranges are available in Ad Manager and Ad History.' },
            { q: 'What does the BQool Insight panel show?', a: 'BQool Insight automatically analyzes your recent performance data and surfaces 3–5 actionable recommendations ranked by potential impact.' },
            { q: 'Why do my dashboard numbers differ from Amazon\'s?', a: 'Amazon\'s attribution window is 7 days for SP and 14 days for SB/SD. Numbers may differ by a small margin as Amazon finalizes attribution, typically within 48–72 hours.' },
        ],
    },
    {
        id: 'subscription', label: 'Subscription',
        qas: [
            { q: 'What plans are available?', a: 'BQool offers Starter, Professional, and Enterprise plans. Differences include the number of managed stores, API call limits, and access to AI features.' },
            { q: 'Can I upgrade or downgrade at any time?', a: 'Yes. Go to Settings → Subscription to change your plan. Upgrades take effect immediately; downgrades apply at the start of the next billing cycle.' },
            { q: 'Is there a free trial?', a: 'Yes — new accounts receive a 14-day free trial of the Professional plan. No credit card required to start.' },
        ],
    },
    {
        id: 'billing', label: 'Billing',
        qas: [
            { q: 'Where can I find my invoices?', a: 'Go to Settings → Billing → Invoice History. All invoices are available as downloadable PDFs.' },
            { q: 'What payment methods are accepted?', a: 'We accept Visa, Mastercard, American Express, and wire transfers for annual plans over $1,000.' },
            { q: 'Why was I charged more than expected?', a: 'Additional charges may reflect an overage (e.g. managed ad spend exceeding your plan limit). Check Settings → Billing → Usage for a breakdown.' },
        ],
    },
    {
        id: 'account', label: 'Account',
        qas: [
            { q: 'How do I change my password?', a: 'Go to Settings → Account → Security and click "Change Password". You\'ll receive a confirmation email.' },
            { q: 'Can I invite team members?', a: 'Yes. Settings → Account → Team Members lets you invite collaborators with Read-only, Editor, or Admin roles.' },
            { q: 'How do I delete my account?', a: 'Contact support at support@bqool.com. Account deletion is irreversible and removes all historical data.' },
        ],
    },
    {
        id: 'connection', label: 'Connection',
        qas: [
            { q: 'My Amazon store shows "Disconnected" — what do I do?', a: 'Go to Settings → Connections and click "Reconnect". This re-authorizes BQool\'s access to your Seller Central account. Tokens expire periodically and require re-authorization.' },
            { q: 'Which Amazon marketplaces are supported?', a: 'US, CA, MX, UK, DE, FR, IT, ES, JP, AU, and more. See the full list at Settings → Connections → Marketplace Support.' },
            { q: 'Is my data secure?', a: 'Yes. BQool uses OAuth for Amazon authorization (we never store your Seller Central credentials). All data is encrypted in transit (TLS 1.2+) and at rest (AES-256).' },
        ],
    },
    {
        id: 'others', label: 'Others',
        qas: [
            { q: 'How do I export data?', a: 'Click the Download button in any table within Ad Manager or Ad History. Data exports as a CSV file.' },
            { q: 'Is there a mobile app?', a: 'Not yet — BQool is currently a web application optimized for desktop. A mobile companion app is on our roadmap.' },
            { q: 'How do I contact support?', a: 'Click the "Help Center" button in the Pilot panel, or email support@bqool.com. Live chat is available weekdays 9am–6pm PST.' },
        ],
    },
];

// ─── Accordion QA Item ────────────────────────────────────────────────────────
function QAItem({ qa }: { qa: QA }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-blue-200 shadow-sm' : 'border-gray-100'}`}>
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full text-left px-4 py-3 flex items-start justify-between gap-2 text-sm font-medium transition-colors
          ${open ? 'bg-blue-50 text-blue-900' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
            >
                <span className="leading-snug">{qa.q}</span>
                <span className="shrink-0 mt-0.5 text-gray-400">
                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
            </button>
            {open && (
                <div className="px-4 py-3 bg-white border-t border-blue-100 text-sm text-gray-600 leading-relaxed">
                    {qa.a}
                </div>
            )}
        </div>
    );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
interface HelpCenterPanelProps { onClose: () => void }

// ─── Contact Form ─────────────────────────────────────────────────────────────
function ContactForm({ onBack }: { onBack: () => void }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [category, setCategory] = useState('General');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000)); // Simulate submit
        setLoading(false);
        setSent(true);
    };

    if (sent) return (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                <ArrowLeft size={12} /> Back to Help Center
            </button>
            <div className="flex flex-col items-center justify-center gap-3 py-8">
                <CheckCircleFill size={40} className="text-green-500" />
                <p className="text-sm font-semibold text-gray-800">Message Sent!</p>
                <p className="text-xs text-gray-500 text-center">Our support team will get back to you within 1 business day.</p>
                <button onClick={onBack}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    Back to Help Center
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto p-4">
            <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-4">
                <ArrowLeft size={12} /> Back to Help Center
            </button>
            <p className="text-sm font-bold text-gray-800 mb-3">Contact Support</p>
            <form onSubmit={handleSend} className="space-y-3">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                        className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                        className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-all">
                        {['General', 'AI Bidding', 'Auto-Harvesting', 'Budget Manager', 'Campaign Builder', 'Dashboard', 'Billing', 'Account', 'Connection', 'Other'].map(c =>
                            <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Message <span className="text-red-400">*</span></label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                        placeholder="Describe your issue or question..."
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-all resize-none" />
                </div>
                <button type="submit" disabled={!message.trim() || loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</> : 'Send Message'}
                </button>
            </form>
        </div>
    );
}

export function HelpCenterPanel({ onClose }: HelpCenterPanelProps) {
    const [activeTab, setActiveTab] = useState('popular');
    const [search, setSearch] = useState('');
    const [showContact, setShowContact] = useState(false);

    if (showContact) return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="shrink-0 px-4 py-3 border-b border-gray-100 bg-blue-50 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-900">Help Center</span>
                <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">Close</button>
            </div>
            <ContactForm onBack={() => setShowContact(false)} />
        </div>
    );

    const current = CATEGORIES.find(c => c.id === activeTab)!;

    // Filter QA by search across all categories, or just current tab
    const displayedQAs = search.trim()
        ? CATEGORIES.flatMap(c => c.qas).filter(qa =>
            qa.q.toLowerCase().includes(search.toLowerCase()) ||
            qa.a.toLowerCase().includes(search.toLowerCase())
        )
        : current.qas;

    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Sub-header */}
            <div className="shrink-0 px-4 py-3 border-b border-gray-100 bg-blue-50 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-900">Help Center</span>
                <button
                    onClick={onClose}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                    Close
                </button>
            </div>

            {/* Search bar */}
            <div className="shrink-0 px-4 pt-3 pb-2">
                <div className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search help articles..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            {/* Category tabs — horizontal scroll */}
            {!search.trim() && (
                <div className="shrink-0 px-2 pb-1 overflow-x-auto">
                    <div className="flex gap-1 min-w-max px-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${activeTab === cat.id
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Q&A list */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
                {search.trim() && (
                    <p className="text-xs text-gray-400 mb-2 italic">{displayedQAs.length} result{displayedQAs.length !== 1 ? 's' : ''} for "{search}"</p>
                )}
                {displayedQAs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
                        <Search size={24} className="opacity-40" />
                        <span className="text-sm">No articles found</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayedQAs.map((qa, i) => <QAItem key={i} qa={qa} />)}
                    </div>
                )}
                {/* Contact support footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">Still need help?</p>
                    <button onClick={() => setShowContact(true)}
                        className="text-xs text-blue-500 hover:underline font-medium">Contact Support →</button>
                </div>
            </div>
        </div>
    );
}
