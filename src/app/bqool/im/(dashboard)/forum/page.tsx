'use client';

import React, { useState, useEffect } from 'react';
import { ChatSquareDots, HandThumbsUp, Search, Chat, Image as ImageIcon } from 'react-bootstrap-icons';
import { Button } from '@/components/bqool/ui/Button';
import { TabGroup } from '@/components/bqool/ui/TabGroup';
import { NewDiscussionModal } from '@/components/bqool/forum/NewDiscussionModal';
import { db } from '@/lib/bqool/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/bqool/context/AuthContext';

// --- TYPES ---
interface ForumPost {
    id: string;
    topic: string; // 'general', 'strategy', etc.
    title: string;
    content: string;
    authorName: string;
    createdAt: any;
    replyCount: number;
    likes: number;
    images?: string[];
}

const TOPICS = [
    { id: 'all', label: 'All Topics' },
    { id: 'general', label: 'General' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'qna', label: 'Q&A' },
];

export default function IMForumPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [activeTopic, setActiveTopic] = useState('all');
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- FIRESTORE SUBSCRIPTION ---
    useEffect(() => {
        setLoading(true);
        const postsRef = collection(db, 'forum_posts');

        // Construct Query
        let q;
        if (activeTopic === 'all') {
            q = query(postsRef, orderBy('createdAt', 'desc'));
        } else {
            q = query(postsRef, where('topic', '==', activeTopic), orderBy('createdAt', 'desc'));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ForumPost));
            setPosts(fetchedPosts);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching forum posts:", error);
            // Fallback for missing index or other errors
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeTopic]);

    // --- HANDLERS ---
    const handleCreatePost = async (data: { title: string; topic: string; content: string; images: string[] }) => {
        try {
            await addDoc(collection(db, 'forum_posts'), {
                ...data,
                authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
                createdAt: serverTimestamp(),
                replyCount: 0,
                likes: 0,
                viewCount: 0
            });
        } catch (error) {
            console.error("Error creating post:", error);
            alert("Failed to create post. See console.");
        }
    };

    const helperFormatTime = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        // Handle Firestore Timestamp or Date
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    // Filter by search
    const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="w-full max-w-[1200px] mx-auto p-6">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <ChatSquareDots className="text-purple-600" /> Community Forum
                    </h1>
                    <p className="text-gray-500 mt-1">Discuss strategies, troubleshoot issues, and share success.</p>
                </div>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>New Discussion</Button>
            </div>

            {/* Search & Tabs */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                {/* Search */}
                <div className="flex bg-gray-50 rounded-md border border-gray-200 px-3 py-2 mb-4">
                    <Search className="text-gray-400 w-5 h-5 my-auto" />
                    <input
                        type="text"
                        placeholder="Search discussions..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-sm ml-2 outline-none"
                    />
                </div>

                {/* Topics Tabs */}
                <TabGroup
                    items={TOPICS}
                    activeId={activeTopic}
                    onSelect={setActiveTopic}
                />
            </div>

            {/* Posts List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading community discussions...</div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-2">No discussions found in this topic.</p>
                        <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Start the Conversation</Button>
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <div
                            key={post.id}
                            onClick={() => router.push(`/bqool/im/forum/discussion?id=${post.id}`)}
                            className="bg-white p-6 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer group shadow-sm hover:shadow-md"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider
                                            ${post.topic === 'announcements' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}
                                        `}>
                                            {TOPICS.find(t => t.id === post.topic)?.label || post.topic}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 mb-1 flex items-center gap-2">
                                        {post.title}
                                        {post.images && post.images.length > 0 && <ImageIcon size={14} className="text-gray-400" />}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                        {post.content}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span className="font-medium text-gray-600">{post.authorName}</span>
                                        <span>•</span>
                                        <span>{helperFormatTime(post.createdAt)}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Chat size={12} /> {post.replyCount || 0} replies</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-1 text-gray-400 ml-4 pl-4 border-l border-gray-100">
                                    <HandThumbsUp size={18} />
                                    <span className="text-sm font-bold">{post.likes || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            <NewDiscussionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreatePost}
                topics={TOPICS.filter(t => t.id !== 'all')}
            />

        </div>
    );
}
