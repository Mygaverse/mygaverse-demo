'use client';
import React, { useState, useEffect } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import Button from '@/components/scriptoplay/ui/Button';
import { ICONS } from '@/config/scriptoplay/icons';
import { AddItemButton, CharacterCard, SettingCard, ThemeTag, PlotModuleCard } from './ModuleGrids';

import MagicLogline from '@/components/scriptoplay/dashboard/workspace/MagicLogline';

export default function SynopsisPhase({
    logline, onBack,
    synopsisData, setSynopsisData,
    characters, setCharacters,
    settings, setSettings,
    themes, setThemes,
    plots, setPlots,
    onMagicPolish, isGenerating,
    onAddModule
}: any) {

    return (
        <div className="max-w-6xl mx-auto pb-20 space-y-8 animate-in slide-in-from-bottom-4">

            {/* HEADER */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Structure your Synopsis</h1>
                    <p className="text-gray-400 text-sm">Expand your logline using generated Narrative Text and World Modules.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className='cursor-pointer'
                        onClick={onBack}
                    >Edit Logline</Button>

                    {/* RENAMED BUTTON */}
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={ICONS.sparkles}
                        onClick={onMagicPolish}
                        isLoading={isGenerating}
                        className="bg-purple-900/20 text-purple-300 border-purple-500/30 hover:bg-purple-900/40 cursor-pointer"
                    >
                        Magic Polish
                    </Button>
                </div>
            </div>

            {/* LOGLINE ANCHOR */}
            <div className="bg-[#141414] border-l-4 border-purple-600 border border-r-[#262626] border-y-[#262626] rounded-r-xl p-5 shadow-lg flex gap-4 items-center">
                <div className="p-2 bg-purple-900/20 rounded-lg">
                    <Icon icon={ICONS.lock} size={20} className="text-purple-400" />
                </div>
                <div>
                    <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Logline</span>
                    <p className="text-lg text-gray-200 font-medium leading-relaxed pl-2">"{logline}"</p>
                </div>
            </div>

            {/* === THE WORKBENCH GRID === */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* --- LEFT: NARRATIVE (7 Cols) --- */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Note: Ensure NarrativeSection is imported or defined here as before */}

                    {/* 1. Intro */}
                    <NarrativeSection
                        title="1. Introduction"
                        icon={ICONS.play}
                        limit="50-100"
                        minHeight='min-h-[150px]'
                        value={synopsisData.intro}
                        onChange={(val: string) => setSynopsisData({ ...synopsisData, intro: val })}
                    />

                    {/* 2. Plot (Big) */}
                    <NarrativeSection
                        title="2. Plot Summary"
                        icon={ICONS.list}
                        limit="200-500"
                        minHeight='min-h-[500px]'
                        value={synopsisData.plot}
                        onChange={(val: string) => setSynopsisData({ ...synopsisData, plot: val })}
                    />

                    {/* 3. Resolution */}
                    <NarrativeSection
                        title="3. Resolution"
                        icon={ICONS.checkCircle}
                        limit="50-100"
                        minHeight='min-h-[200px]'
                        value={synopsisData.resolution} onChange={(val: string) => setSynopsisData({ ...synopsisData, resolution: val })}
                    />
                </div>

                {/* --- RIGHT: MODULES (4 Cols) --- */}
                <div className="lg:col-span-5 flex flex-col gap-6">

                    {/* Visual Hint */}
                    <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-full text-blue-400"><Icon icon={ICONS.sparkles} size={14} /></div>
                        <p className="text-xs text-blue-200">
                            <strong>Script Modules Active:</strong> Changes here update your project database.
                        </p>
                    </div>

                    {/* CHARACTERS */}
                    <ModuleBox title="Characters" icon={ICONS.user} color="text-purple-400" onAdd={() => onAddModule('characters')}>
                        {characters.map((char: any, i: number) => <CharacterCard key={char.id || i} char={char} />)}
                    </ModuleBox>

                    {/* SETTINGS */}
                    <ModuleBox title="Settings" icon={ICONS.map} color="text-blue-400" onAdd={() => onAddModule('settings')}>
                        {settings.map((place: any, i: number) => <SettingCard key={place.id || i} setting={place} />)}
                    </ModuleBox>

                </div>
            </div>

            {/* === BOTTOM ROW: THEMES + PLOTS === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-0 border-[#262626] pt-8">
                {/* THEMES */}
                <ModuleBox title="Themes" icon={ICONS.sparkles} color="text-pink-400" onAdd={() => onAddModule('themes')}>
                    <div className="flex flex-wrap gap-2">
                        {themes.map((t: any, i: number) => <ThemeTag key={t.id || i} theme={t} />)}
                    </div>
                </ModuleBox>

                {/* PLOTS */}
                <ModuleBox title="Plot Points" icon={ICONS.layers} color="text-green-400" onAdd={() => onAddModule('plots')}>
                    {plots.map((p: any, i: number) => <PlotModuleCard key={p.id || i} plot={p} />)}
                </ModuleBox>
            </div>

            <div className="mb-8 mt-18 flex items-start gap-3 p-4 bg-[#1a1a1a] rounded-lg border border-[#262626]">
                <Icon icon={ICONS.info} className="text-gray-400 mt-0.5 shrink-0" size={16} />
                <p className="text-sm text-gray-400">
                    To modify this synopsis, use the <strong>Script Copilot</strong> and <strong>Script Modules</strong> on the right.
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="md" className='cursor-pointer'>Save as Draft</Button>
                <Button variant="primary" size="lg" icon={ICONS.layers} className='cursor-pointer'>
                    Generate Treatment
                </Button>
            </div>
        </div>
    );
}

// Helper Container for Sidebar Boxes
const ModuleBox = ({ title, icon, color, children, onAdd }: any) => (
    <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 ${color}`}>
                <Icon icon={icon} size={20} />
                <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
            </div>
            {/* ADD BUTTON */}
            <button onClick={onAdd} className={`text-xs ${color} hover:text-white transition-colors pr-3 cursor-pointer`}>
                + Add
            </button>
        </div>
        <div className="space-y-3">
            {children}
            {(!children || children.length === 0) && <div className="text-xs text-gray-600 text-center py-2">Empty</div>}
        </div>
    </div>
);

// --- 1. NARRATIVE TEXT COMPONENT (The Story Flow) ---
const NarrativeSection = ({
    title,
    limit,
    value,
    minHeight = "min-h-[180px]", // Default fallback
    icon,
    onChange
}: {
    title: string;
    limit: string;
    value: string;
    minHeight?: string; // prop to control height
    icon: string;
    onChange: (val: string) => void;
}) => {
    const [isMagicMode, setMagicMode] = useState(false);
    // We need to sync local state with parent prop 'value'
    // so when AI updates the parent, this box updates too.
    const [text, setText] = useState(value);

    useEffect(() => { setText(value); }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        onChange(e.target.value);
    };

    // Parse Max Limit
    const maxWords = parseInt(limit.split('-')[1]) || 100;
    const wordCount = (text || '').trim().split(/\s+/).filter(w => w.length > 0).length;
    const isOverLimit = wordCount > maxWords;

    return (
        <div className={`bg-[#141414] border rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${isMagicMode ? 'border-purple-500 ring-1 ring-purple-500/30' : 'border-[#262626]'
            }`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#262626] flex justify-between items-center bg-[#1a1a1a]/50">
                <div className="flex items-center gap-3">
                    <Icon icon={icon} size={18} className="text-gray-400" />
                    <h3 className="text-[18px] font-bold text-gray-200">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[12px] text-gray-500 font-mono mr-2">{limit} Words</span>
                    <button
                        onClick={() => setMagicMode(!isMagicMode)}
                        className={`p-1.5 rounded transition-colors ${isMagicMode ? 'text-purple-400 bg-purple-900/20' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Icon icon={ICONS.wand} size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className={` w-full bg-[#0a0a0a] relative ${minHeight}`}>
                {isMagicMode ? (
                    <div className="p-4"><MagicLogline text={text} isMagicMode={true} /></div>
                ) : (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-full bg-transparent p-4 text-sm text-gray-300 placeholder-gray-700 outline-none resize-none leading-relaxed"
                    />
                )}
                <div className="absolute bottom-4 right-4 flex items-center gap-3 pointer-events-none bg-gray-900 px-2 py-1 rounded-md">
                    <div className={`text-xs font-medium ${isOverLimit ? 'text-red-400' : 'text-gray-500'}`}>
                        {wordCount} / {maxWords} Words
                    </div>
                </div>
            </div>
        </div>
    );
};