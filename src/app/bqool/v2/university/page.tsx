'use client';

import React, { useEffect, useState } from 'react';
import { PlayCircle, Clock, Book } from 'react-bootstrap-icons';
import { Button } from '@/components/bqool/ui/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { learnWorldClient, Course } from '@/lib/bqool/learnworld';
import { DashboardShell } from '@/components/bqool/layout/DashboardShell';
import { UserGuard } from '@/components/bqool/auth/UserGuard';

export default function V2UniversityPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('all');
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Direct client-side call (Mock)
                const data = await learnWorldClient.getCourses();
                setCourses(data);
            } catch (err) {
                console.error('Error loading courses:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const [launchingCourseId, setLaunchingCourseId] = useState<string | null>(null);

    const [ssoLoading, setSsoLoading] = useState(false);

    // Derive unique category tabs from fetched courses
    const categoryTabs = [
        'all',
        ...Array.from(new Set(courses.flatMap(c => c.categories).filter(Boolean))).sort(),
    ];
    const filteredCourses = activeTab === 'all' ? courses : courses.filter(c => c.categories.includes(activeTab));

    const handleSSOLogin = async () => {
        if (!user) return;
        setSsoLoading(true);
        try {
            // Direct client-side call (Real API)
            const url = await learnWorldClient.generateSSOUrl(
                user.email || '',
                user.uid,
                user.displayName || 'User'
            );
            window.open(url, '_blank');
        } catch (err) {
            console.error('SSO Error:', err);
            alert('Failed to initiate SSO: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSsoLoading(false);
        }
    };

    const handleCourseClick = async (course: Course) => {
        if (!user || launchingCourseId) return;
        setLaunchingCourseId(course.id);

        // 1. Open popup immediately
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
            // 2. Generate SSO URL pointing directly to this course
            const path = `/path-player?courseid=${course.id}`;
            const ssoUrl = await learnWorldClient.generateSSOUrl(
                user.email || '',
                user.uid,
                user.displayName || 'User',
                '',
                path
            );

            // 3. Redirect popup to SSO URL
            if (popup) {
                popup.location.href = ssoUrl;
            } else {
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
            setLaunchingCourseId(null);
        }
    };

    return (
        <UserGuard>
            <DashboardShell>
                <div className="p-6 max-w-[1200px] mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <Book className="text-blue-600" /> BQool University
                            </h1>
                            <p className="text-gray-500 mt-1">Master Amazon selling with our expert-led video courses.</p>
                        </div>
                        <Button onClick={handleSSOLogin} variant="primary" disabled={ssoLoading || loading}>
                            {ssoLoading ? 'Redirecting...' : 'Visit BQool University on LearnWorld (SSO)'}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Loading courses...</div>
                    ) : (
                        <>
                            {/* Dynamic category tabs */}
                            {categoryTabs.length > 1 && (
                                <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200">
                                    {categoryTabs.map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeTab === tab
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                                                }`}
                                        >
                                            {tab === 'all' ? 'All Courses' : tab}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCourses.map(course => (
                                    <div
                                        key={course.id}
                                        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer group"
                                        onClick={() => handleCourseClick(course)}
                                    >
                                        <div className="relative h-48 bg-gray-100 overflow-hidden">
                                            <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <PlayCircle size={48} className="text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow-lg" />
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                {course.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} /> {course.duration}
                                                </span>
                                                <span>{course.lessons_count} Lessons</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </DashboardShell>
        </UserGuard>
    );
}
