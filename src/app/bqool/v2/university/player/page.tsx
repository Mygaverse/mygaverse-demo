'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LearnWorldClient } from '@/lib/bqool/learnworld';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { UserGuard } from '@/components/bqool/auth/UserGuard';

const learnWorldClient = new LearnWorldClient();

function CoursePlayerContent() {
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');
    const router = useRouter();
    const { user } = useAuth();

    // State
    const [course, setCourse] = useState<any>(null);
    const [contents, setContents] = useState<any>(null);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [ssoLoading, setSsoLoading] = useState(false);
    const [launchUrl, setLaunchUrl] = useState<string | null>(null);

    // Auto-generate SSO Link for Iframe when unit is selected
    useEffect(() => {
        const generateFrameUrl = async () => {
            if (!selectedUnit || selectedUnit.videoUrl || !user || !courseId) {
                setLaunchUrl(null);
                return;
            }

            try {
                const effectiveSlug = contents?.id || courseId;
                const path = `/path-player?courseid=${effectiveSlug}&unit=${selectedUnit.id}`;

                const url = await learnWorldClient.generateSSOUrl(
                    user.email || '',
                    user.uid,
                    user.displayName || 'User',
                    '',
                    path,
                    undefined
                );
                setLaunchUrl(url);
            } catch (err) {
                console.error('Failed to generate iframe URL', err);
            }
        };
        generateFrameUrl();
    }, [selectedUnit, user, courseId]);

    useEffect(() => {
        const fetchCourseData = async () => {
            if (!courseId) return;

            setLoading(true);
            try {
                const coursesData = await learnWorldClient.getCourses();
                const foundCourse = coursesData.find((c: any) => c.id === courseId);
                setCourse(foundCourse);

                const contentData = await learnWorldClient.getCourseContents(courseId);
                setContents(contentData);

            } catch (err) {
                console.error('Failed to load course data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [courseId]);

    const handleUnitClick = async (unit: any) => {
        setSelectedUnit(unit);

        try {
            const effectiveCourseId = contents?.id || courseId;

            if (unit.id) {
                const details = await learnWorldClient.getLearningUnit(effectiveCourseId, unit.id);
                if (details && !details.error) {
                    setSelectedUnit((prev: any) => ({ ...prev, ...details }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch unit details:', error);
        }
    };

    const handleSSOLogin = async (targetUnitId?: string) => {
        if (!user) return;
        setSsoLoading(true);
        try {
            let path = '';
            const effectiveSlug = contents?.id || courseId;

            if (effectiveSlug) {
                const unitToLink = targetUnitId || selectedUnit?.id;

                if (unitToLink) {
                    path = `/path-player?courseid=${effectiveSlug}&unit=${unitToLink}`;
                    targetUnitId = undefined;
                } else {
                    path = `/course/${effectiveSlug}`;
                }
            }

            const url = await learnWorldClient.generateSSOUrl(
                user.email || '',
                user.uid,
                user.displayName || 'User',
                '',
                path,
                targetUnitId
            );
            window.open(url, '_blank');
        } catch (err) {
            console.error('SSO Error:', err);
            alert('Failed to initiate SSO: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSsoLoading(false);
        }
    };

    if (!courseId) return <div className="p-10 text-center">No course selected</div>;
    if (loading) return <div className="p-10 text-center">Loading course content...</div>;

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Top Bar */}
            <div className="h-16 border-b flex items-center px-4 bg-gray-900 text-white shrink-0 justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="hover:text-gray-300">
                        ← Back
                    </button>
                    <h1 className="font-bold text-lg truncate max-w-xl">{course?.title || 'Course Content'}</h1>
                </div>
                <button
                    onClick={() => handleSSOLogin()}
                    disabled={ssoLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded font-medium disabled:opacity-50"
                >
                    {ssoLoading ? 'Opening...' : 'Open in LearnWorlds'}
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Syllabus */}
                <div className="w-80 border-r bg-gray-50 overflow-y-auto hidden md:flex flex-col">
                    <div className="p-4 font-bold text-gray-700 border-b">
                        Course Syllabus
                    </div>
                    <div className="flex-1 p-2 space-y-4">
                        {contents?.sections?.map((section: any) => (
                            <div key={section.id}>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                                    {section.title}
                                </h3>
                                <div className="space-y-1">
                                    {section.learningUnits?.map((unit: any) => (
                                        <button
                                            key={unit.id}
                                            onClick={() => handleUnitClick(unit)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors ${selectedUnit?.id === unit.id
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'hover:bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            <span className="text-gray-400 text-xs text-opacity-70">
                                                {unit.type === 'ivideo' ? '▶' : '📄'}
                                            </span>
                                            <span className="truncate">{unit.title}</span>
                                        </button>
                                    ))}
                                    {(!section.learningUnits || section.learningUnits.length === 0) && (
                                        <div className="px-3 text-xs text-gray-400 italic">No units</div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {!contents?.sections && !contents?.error && (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No sections found. <br />
                                <span className="text-xs opacity-75">ID: {courseId}</span>
                            </div>
                        )}
                        {contents?.error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600 text-xs break-words">
                                <strong>Error loading contents:</strong><br />
                                {contents.error}<br />
                                {contents.details}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-gray-100 relative">
                    {selectedUnit ? (
                        <div className="max-w-4xl mx-auto p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">{selectedUnit.title}</h2>

                            <div className="bg-white rounded-lg shadow-sm border p-1 aspect-video flex flex-col relative overflow-hidden text-center bg-gray-50">
                                {selectedUnit.videoUrl ? (
                                    <iframe
                                        src={selectedUnit.videoUrl}
                                        className="w-full h-full"
                                        title={selectedUnit.title}
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-6">
                                        <div className="text-5xl mb-4">🔐</div>
                                        <h3 className="font-bold text-xl text-gray-800 mb-2">Protected Content</h3>
                                        <p className="text-gray-500 text-sm max-w-md mb-8">
                                            This lesson must be viewed in the secure Course Player.
                                        </p>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => {
                                                    const url = launchUrl;
                                                    if (url) {
                                                        window.open(url, 'CoursePlayer', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
                                                    } else {
                                                        handleSSOLogin(selectedUnit.id);
                                                    }
                                                }}
                                                disabled={!launchUrl && !user}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                                            >
                                                {ssoLoading ? 'Preparing...' : '▶ Launch Player'}
                                            </button>

                                            <button
                                                onClick={() => handleSSOLogin()}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-full transition-colors"
                                            >
                                                Open Course Home
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-6">
                                            Opens in a dedicated popup window
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedUnit.description && (
                                <div className="mt-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedUnit.description }} />
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-3xl">📚</div>
                            <h3 className="text-xl font-medium text-gray-600 mb-2">Select a lesson</h3>
                            <p className="max-w-sm">
                                Choose a learning unit from the sidebar to view its details.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function V2CoursePlayerPage() {
    return (
        <UserGuard>
            <Suspense fallback={<div className="p-8">Loading player...</div>}>
                <CoursePlayerContent />
            </Suspense>
        </UserGuard>
    );
}
