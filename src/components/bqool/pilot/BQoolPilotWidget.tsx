'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LogoPilot } from '../ui/LogoPilot';
import { X, Send, Search, BarChartFill, ChatDots, Stars } from 'react-bootstrap-icons';
import { usePilot } from './PilotContext';
import { useDataAnalyzer } from './useDataAnalyzer';
import { DataAnalyzerResults } from './DataAnalyzerResults';
import { DataAnalyzerOverlay } from './DataAnalyzerOverlay';
import { DataFinderPanel } from './DataFinderPanel';
import { HelpCenterPanel } from './HelpCenterPanel';
import { AICreditsBlock, BASIC_PLAN_USAGE } from './AICreditsBlock';
import { usePathname } from 'next/navigation';

export function BQoolPilotWidget() {
    const { isOpen, togglePilot, closePilot, analyzerMode, openPilot } = usePilot();
    const { startSelecting } = useDataAnalyzer();
    const [input, setInput] = useState('');
    const [finderMode, setFinderMode] = useState(false);
    const [helpMode, setHelpMode] = useState(false);
    const pathname = usePathname();

    // Only show on V2 pages
    if (!pathname?.startsWith('/bqool/v2')) {
        return null;
    }

    const [messages, setMessages] = useState<{ role: 'user' | 'pilot', content: string, isIntro?: boolean }[]>([
        { role: 'pilot', content: "Hi! I'm BQool Pilot. How can I help you optimize your ads today?" },
        { role: 'pilot', content: '', isIntro: true },
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Auto-open the panel when analysis results are ready
    useEffect(() => {
        if (analyzerMode === 'results') {
            openPilot();
        }
    }, [analyzerMode, openPilot]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'pilot', content: `I'm analyzing your request: "${userMsg}". (AI integration coming soon!)` }]);
        }, 1000);
    };

    const isAnalyzerActive = analyzerMode !== 'idle';
    const showResults = analyzerMode === 'results';
    // Hide Pilot completely during selection / analyzing — let user see the page
    const isHidden = analyzerMode === 'selecting' || analyzerMode === 'analyzing';

    return (
        <>
            {/* Full-page selection overlay (rendered globally, above everything) */}
            <DataAnalyzerOverlay />

            {/* Floating Trigger Button — hidden during selection/analyzing */}
            <button
                onClick={togglePilot}
                className={`fixed bottom-6 right-6 z-[1100] transition-all duration-300 transform hover:scale-110
                    ${isHidden ? 'opacity-0 pointer-events-none scale-90' : ''}
                    ${isOpen ? 'rotate-90 opacity-0 pointer-events-none' : 'opacity-100'}
                `}
            >
                <div className="relative w-16 h-16 rounded-full shadow-2xl overflow-hidden border-4 border-white/20 hover:border-white/40 ring-4 ring-indigo-500/30 hover:ring-indigo-500/50 bg-indigo-300 hover:bg-indigo-400 transition-all flex items-center justify-center">
                    <LogoPilot className="w-12 h-12" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
            </button>

            {/* Slide-over Panel — also hidden during selection/analyzing */}
            <div
                className={`fixed bottom-6 right-3 sm:right-6 w-[calc(100vw-24px)] sm:w-[400px] bg-white rounded-2xl shadow-2xl z-[1100] flex flex-col overflow-hidden border border-gray-100 transition-all duration-300 transform origin-bottom-right
                    h-[min(600px,calc(100vh-130px))]
                    ${isHidden ? 'scale-90 opacity-0 translate-y-10 pointer-events-none' : ''}
                    ${!isHidden && isOpen ? 'scale-100 opacity-100 translate-y-0' : (!isHidden ? 'scale-90 opacity-0 translate-y-10 pointer-events-none' : '')}
                `}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full bg-white/10 p-1 border border-white/20 flex items-center justify-center">
                            <LogoPilot className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">BQool Pilot</h3>
                            <p className="text-xs text-indigo-100 flex items-center gap-1">
                                <Stars size={10} />
                                {isAnalyzerActive ? 'Data Analyzer Active' : 'AI Assistant Active'}
                            </p>
                        </div>
                        {/* Credit chips — same style as Insight */}
                        <div className="flex items-center gap-1.5 text-[11px]">
                            <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-lg px-2 py-1">
                                <span className="text-indigo-200">Credits</span>
                                <span className="font-bold text-white">2</span>
                                <span className="text-indigo-300">/10</span>
                                <div className="w-10 h-1.5 bg-white/10 rounded-full overflow-hidden ml-0.5">
                                    <div className="h-full bg-green-400 rounded-full" style={{ width: '20%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={closePilot} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body: toggle between results / finder / chat */}
                {showResults ? (
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        <DataAnalyzerResults />
                    </div>
                ) : finderMode ? (
                    <DataFinderPanel onClose={() => setFinderMode(false)} />
                ) : helpMode ? (
                    <HelpCenterPanel onClose={() => setHelpMode(false)} />
                ) : (
                    <>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.isIntro ? (
                                        /* ── Feature intro cards ── */
                                        <div className="w-full space-y-2 mt-1">
                                            {[
                                                { icon: <BarChartFill size={14} className="text-indigo-500" />, color: 'bg-indigo-50 border-indigo-100', title: 'Data Analyzer', desc: 'Select any table row and get instant AI-generated insights and actionable opportunities.' },
                                                { icon: <Search size={14} className="text-purple-500" />, color: 'bg-purple-50 border-purple-100', title: 'Data Finder', desc: 'Search across campaigns, ad groups, and more with filters and keyword queries.' },
                                                { icon: <ChatDots size={14} className="text-blue-500" />, color: 'bg-blue-50 border-blue-100', title: 'Help Center', desc: 'Browse FAQs by category or search for answers — and contact support anytime.' },
                                            ].map(f => (
                                                <div key={f.title} className={`${f.color} border rounded-xl px-3 py-2.5 flex items-start gap-2.5`}>
                                                    <span className="mt-0.5 shrink-0">{f.icon}</span>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-800">{f.title}</p>
                                                        <p className="text-xs text-gray-500 leading-snug mt-0.5">{f.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                            ${msg.role === 'user'
                                                ? 'bg-indigo-600 text-white rounded-tr-sm'
                                                : 'bg-white text-gray-700 border border-gray-100 rounded-tl-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {/* Analyzing indicator in chat */}
                            {analyzerMode === 'analyzing' && (
                                <div className="flex justify-start">
                                    <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-3.5 rounded-2xl rounded-tl-sm text-sm flex items-center gap-2">
                                        <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                        Analyzing your selected data...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>


                        {/* Quick Actions */}
                        <div className="px-4 py-2 bg-white border-t border-gray-100 grid grid-cols-3 gap-2">
                            <button
                                onClick={startSelecting}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-indigo-50 text-xs gap-0.5 transition-colors group
                                    ${isAnalyzerActive ? 'text-indigo-700 bg-indigo-50' : 'text-gray-600'}`}
                            >
                                <div className={`p-1.5 rounded-md transition-colors
                                    ${isAnalyzerActive ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200'}`}>
                                    <BarChartFill size={16} />
                                </div>
                                <span>Data Analyzer</span>
                                <span className="text-[9px] text-gray-400">0/1 free</span>
                            </button>
                            <button
                                onClick={() => { setFinderMode(true); }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-purple-50 text-xs gap-0.5 transition-colors group
                                    ${finderMode ? 'text-purple-700 bg-purple-50' : 'text-gray-600'}`}
                            >
                                <div className={`p-1.5 rounded-md transition-colors
                                    ${finderMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'}`}>
                                    <Search size={16} />
                                </div>
                                <span>Data Finder</span>
                                <span className="text-[9px] text-gray-400">0/1 free</span>
                            </button>
                            <button
                                onClick={() => { setHelpMode(true); setFinderMode(false); }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-blue-50 text-xs gap-0.5 transition-colors group
                                    ${helpMode ? 'text-blue-700 bg-blue-50' : 'text-gray-600'}`}
                            >
                                <div className={`p-1.5 rounded-md transition-colors
                                    ${helpMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'}`}>
                                    <ChatDots size={16} />
                                </div>
                                <span>Help Center</span>
                                <span className="text-[9px] text-green-500">∞ free</span>
                            </button>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <form onSubmit={handleSubmit} className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask me anything..."
                                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                >
                                    <Send size={14} />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
