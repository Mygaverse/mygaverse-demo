'use client';
import React, { useEffect, useState } from 'react';

const steps = [
    { id: 'setup', label: '1. Goal Setup' },
    { id: 'products', label: '2. Products' },
    { id: 'strategy', label: '3. Goal Strategy' },
    { id: 'preview', label: '4. Preview' },
    { id: 'competing', label: '5. Competing Campaign' },
    { id: 'launch', label: '6. Launch Goal' },
];

export const StepNavigator: React.FC = () => {
    const [active, setActive] = useState<string>(steps[0].id);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (visible) setActive(visible.target.id);
            },
            { root: null, rootMargin: '-35% 0px -35% 0px', threshold: [0.25, 0.5, 0.75, 1] }
        );

        steps.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const activeIndex = steps.findIndex((s) => s.id === active);

    return (
        <nav className="bg-[#4aaada] text-white px-4 py-3 sticky top-0 z-[100] rounded-lg shadow-md">
            <div className="max-w-[1200px] mx-auto overflow-x-auto">
                <div className="flex items-center gap-4 min-w-[640px]">
                    {steps.map((s, i) => {
                        const isActive = s.id === active;
                        const completed = i < activeIndex;

                        return (
                            <React.Fragment key={s.id}>
                                <a
                                    href={`#${s.id}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        setActive(s.id);
                                    }}
                                    aria-current={isActive ? 'step' : undefined}
                                    className="flex items-center gap-3 whitespace-nowrap"
                                >
                                    <span className="relative flex items-center">
                                        <span
                                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                                                isActive ? 'bg-white text-[#4aaada]' : completed ? 'bg-white text-[#4aaada]' : 'bg-white/20 text-white'
                                            }`}
                                        >
                                            {completed && !isActive ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span className={`${isActive ? 'font-bold' : ''}`}>{i + 1}</span>
                                            )}
                                        </span>
                                    </span>

                                    <span className={`opacity-90 transition-colors ${isActive ? 'text-white' : 'text-white/90 hover:text-white'}`}>{s.label}</span>
                                </a>

                                {i !== steps.length - 1 && <div className={`flex-1 h-[2px] ${i < activeIndex ? 'bg-white' : 'bg-white/30'}`} />}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};