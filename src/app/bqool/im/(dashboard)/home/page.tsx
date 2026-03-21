'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PersonBadge, Shop, ChatSquareQuote, ArrowRight, CheckCircleFill, Megaphone, ExclamationCircle, InfoCircle } from 'react-bootstrap-icons';
import { Button } from '@/components/bqool/ui/Button';
import { collection, query, orderBy, limit, getDocs, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Announcement } from '@/components/bqool/im/types';
import { DynamicTable, ColumnDef } from '@/components/bqool/tables/DynamicTable';

export default function IMHomePage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [pendingUsers, setPendingUsers] = useState<any[]>([]); // Using any for simplicity here, or reuse UserData
    const [loading, setLoading] = useState(true);

    const [recentPost, setRecentPost] = useState<any>(null);
    const [popularPost, setPopularPost] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Latest Announcements (Client-side filter avoids Index Requirement)
                const annQ = query(
                    collection(db, 'announcements'),
                    orderBy('createdAt', 'desc'), // Only sort by date
                    limit(10) // Fetch top 10 then filter
                );
                const annSnap = await getDocs(annQ);
                const allAnn = annSnap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));

                // Client-side filter for 'published' and limited to 3
                const publishedAnn = allAnn.filter(a => a.status === 'published').slice(0, 3);
                setAnnouncements(publishedAnn);

                // 2. Fetch Pending Users
                const userQ = query(collection(db, 'users'), where('status', '==', 'pending'), limit(5));
                const userSnap = await getDocs(userQ);
                setPendingUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // 3. Fetch Forum Posts (Recent)
                const recentQ = query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'), limit(1));
                const recentSnap = await getDocs(recentQ);
                if (!recentSnap.empty) setRecentPost({ id: recentSnap.docs[0].id, ...recentSnap.docs[0].data() });

                // 4. Fetch Forum Posts (Popular - Most Replies)
                const popQ = query(collection(db, 'forum_posts'), orderBy('replyCount', 'desc'), limit(1));
                const popSnap = await getDocs(popQ);
                if (!popSnap.empty) setPopularPost({ id: popSnap.docs[0].id, ...popSnap.docs[0].data() });

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleApprove = async (id: string) => {
        if (!confirm("Approve this user?")) return;
        try {
            await updateDoc(doc(db, "users", id), { status: "approved" });
            setPendingUsers(prev => prev.filter(u => u.id !== id));
        } catch (e) { console.error(e); }
    };

    const userColumns: ColumnDef<any>[] = [
        { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-gray-900">{r.name || '-'}</span> },
        { key: 'email', header: 'Email', render: (r) => <span className="text-gray-600">{r.email}</span> },
        { key: 'createdAt', header: 'Joined', render: (r) => <span className="text-xs text-gray-400">{r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : '-'}</span> },
        {
            key: 'action',
            header: 'Action',
            align: 'center',
            render: (r) => (
                <Button size="sm" onClick={() => handleApprove(r.id)} className="gap-1 bg-green-600 hover:bg-green-700 border-green-600 text-white">
                    <CheckCircleFill size={12} /> Approve
                </Button>
            )
        }
    ];

    const getAnnouncementIcon = (type: string) => {
        switch (type) {
            case 'alert': return <ExclamationCircle className="text-red-600" size={20} />;
            case 'update': return <Megaphone className="text-blue-600" size={20} />;
            default: return <InfoCircle className="text-gray-600" size={20} />;
        }
    };

    const getAnnouncementBg = (type: string) => {
        switch (type) {
            case 'alert': return 'bg-red-50 border-red-100';
            case 'update': return 'bg-blue-50 border-blue-100';
            default: return 'bg-gray-50 border-gray-100';
        }
    };

    // Helper Component for Forum Items
    const ForumHighlight = ({ type, post }: { type: string, post: any }) => {
        if (!post) return null;
        return (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-purple-200 transition-colors">
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${type === 'Recent' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {type}
                    </span>
                    <span className="text-xs text-gray-400">
                        {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </span>
                </div>
                <Link href={`/im/forum/discussion?id=${post.id}`} className="block group">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 truncate mb-1">{post.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{post.content}</p>
                </Link>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span>by <span className="font-medium text-gray-600">{post.authorName}</span></span>
                    <span>•</span>
                    <span>{post.replyCount || 0} replies</span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto p-8 font-sans">

            {/* Header */}
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

            {/* ANNOUNCEMENTS SECTION */}
            {/* ANNOUNCEMENTS SECTION */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Latest Announcements</h2>
                    <Link href="/im/settings/announcement" className="text-sm text-blue-600 hover:underline">Manage Announcements</Link>
                </div>

                {announcements.length > 0 ? (
                    <div className="grid gap-4">
                        {announcements.map(ann => (
                            <div key={ann.id} className={`p-4 rounded-lg border flex gap-4 items-start ${getAnnouncementBg(ann.type)}`}>
                                <div className="mt-1 shrink-0">{getAnnouncementIcon(ann.type)}</div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{ann.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                                    <div className="text-xs text-gray-400 mt-2">{ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-gray-500 bg-gray-50 border border-gray-100 rounded-lg">
                        <p>No new announcements.</p>
                    </div>
                )}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* PENDING APPROVALS */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Pending User Approvals</h2>
                        <Link href="/im/account" className="text-sm text-blue-600 hover:underline">View All Users</Link>
                    </div>

                    {loading ? (
                        <div className="text-center text-gray-400 py-8 flex-1 flex items-center justify-center">Loading...</div>
                    ) : pendingUsers.length > 0 ? (
                        <DynamicTable data={pendingUsers} columns={userColumns} />
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500 flex-1 flex flex-col justify-center items-center">
                            <CheckCircleFill className="mx-auto mb-2 text-green-500" size={24} />
                            <p>All caught up! No pending approvals.</p>
                        </div>
                    )}
                </div>

                {/* FORUM QUICK VIEW */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                <ChatSquareQuote size={18} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Community Forum</h2>
                        </div>
                        <Link href="/im/forum" className="text-sm text-blue-600 hover:underline">Visit Forum</Link>
                    </div>

                    <div className="flex-1 flex flex-col justify-between gap-4">
                        {loading ? (
                            <div className="text-center text-gray-400 py-8 flex-1 flex items-center justify-center">Loading...</div>
                        ) : (
                            <div className="space-y-4">
                                <ForumHighlight type="Recent" post={recentPost} />
                                <ForumHighlight type="Popular" post={popularPost} />
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                            <Link href="/im/forum">
                                <Button variant="outline" className="w-full">Start a New Discussion</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
