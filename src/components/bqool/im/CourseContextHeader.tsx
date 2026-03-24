'use client';

import React, { useState } from 'react';
import { MortarboardFill, JournalText } from 'react-bootstrap-icons';
import { SimplePopover } from '@/components/bqool/ui/SimplePopover';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { learnWorldClient } from '@/lib/bqool/learnworld';

interface CourseContextHeaderProps {
    label: string;
    courseId?: string; // Defaults to the beginner course if not specified
    unitId?: string;   // Defaults to the requested unit if not specified
    popoverTitle?: string;
    popoverDescription?: string;
}

export const CourseContextHeader: React.FC<CourseContextHeaderProps> = ({
    label,
    courseId = 'testing-bqool-ads-beginner',
    unitId = '695786871deb86127d002bfeUnit', // Default from user request
    popoverTitle = 'Master Auto-Harvesting',
    popoverDescription = 'Learn how to automate keyword harvesting to improve your ad performance.'
}) => {
    const { user } = useAuth();
    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 300); // 300ms delay to allow crossing the gap
    };

    const handleCourseClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!user || isLoading) return;

        setIsLoading(true);

        // 1. Open popup immediately to avoid blocker
        const width = 1200;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const popup = window.open(
            '',
            'bqool_uni_player',
            `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no`
        );

        if (popup) {
            popup.document.write(`
                <html>
                    <head><title>Loading BQool University...</title></head>
                    <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f9fafb;">
                        <div style="text-align:center;">
                            <div style="width:40px;height:40px;border:3px solid #e5e7eb;border-top:3px solid #4aaada;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
                            <h3 style="color:#374151;margin:0;">Launching Course Player...</h3>
                        </div>
                        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                    </body>
                </html>
            `);
        }

        try {
            // 2. Generate SSO URL
            const path = `/path-player?courseid=${courseId}&unit=${unitId}`;
            const ssoUrl = await learnWorldClient.generateSSOUrl(
                user.email || '',
                user.uid,
                user.displayName || 'User',
                '',
                path
            );

            // 3. Redirect Popup
            if (popup) {
                popup.location.href = ssoUrl;
            } else {
                // Fallback if popup blocked entirely (rare if opened on click)
                window.open(ssoUrl, '_blank');
            }
        } catch (error) {
            console.error("Failed to launch course:", error);
            if (popup) {
                popup.document.body.innerHTML = `
                    <div style="text-align:center;color:#ef4444;font-family:sans-serif;padding:20px;">
                        <h3>Unable to launch course.</h3>
                        <p>Please check your connection and try again.</p>
                        <button onclick="window.close()" style="padding:8px 16px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;">Close</button>
                    </div>
                `;
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="flex items-center justify-center gap-1.5 cursor-pointer group"
            onClick={handleCourseClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <span className={`font-semibold transition-colors ${isLoading ? 'text-gray-400' : 'text-gray-700 group-hover:text-[#4aaada]'}`}>
                {label}
            </span>

            <SimplePopover
                isOpen={isHovered}
                onOpenChange={setIsHovered}
                align="right"
                width="w-[320px]"
                trigger={
                    <div className={`transition-colors ${isLoading ? 'text-gray-300' : 'text-[#4aaada]'}`}>
                        {isLoading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[#4aaada] rounded-full" />
                        ) : (
                            <MortarboardFill size={16} />
                        )}
                    </div>
                }
                content={
                    <div className="p-3 text-left">
                        <div className="flex items-start gap-2 mb-2">
                            <div className="bg-blue-100 text-[#4aaada] p-1.5 rounded-full shrink-0 mt-0.5">
                                <JournalText size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-gray-900 leading-tight mb-1 break-words">
                                    {popoverTitle}
                                </h4>
                                <p className="text-[10px] text-gray-500 leading-relaxed break-words whitespace-normal">
                                    {popoverDescription}
                                </p>
                            </div>
                        </div>
                        <div className="text-[10px] text-[#4aaada] font-medium text-center border-t border-gray-100 pt-2 mt-1">
                            Click to launch course player
                        </div>
                    </div>
                }
            />
        </div>
    );
};
