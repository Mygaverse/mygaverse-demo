'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Chat, HandThumbsUp, Share, Bell, BellFill, PersonCircle, Send } from 'react-bootstrap-icons';
import { Button } from '@/components/bqool/ui/Button';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { db } from '@/lib/bqool/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, arrayUnion, arrayRemove, increment, serverTimestamp } from 'firebase/firestore';

interface ForumPost {
    id: string;
    topic: string;
    title: string;
    content: string;
    authorName: string;
    createdAt: any;
    replyCount: number;
    likes: number;
    followers?: string[];
    images?: string[];
}

interface Reply {
    id: string;
    postId: string;
    content: string;
    authorName: string;
    createdAt: any;
}

function DiscussionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const postId = searchParams.get('id');
    const { user } = useAuth();

    const [post, setPost] = useState<ForumPost | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock User ID for "Following" logic
    // const CURRENT_USER_ID = 'demo_user_123'; 
    const CURRENT_USER_ID = user?.uid || 'anonymous';
    const dummyRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!postId) return;

        // 1. Subscribe to Post
        const unsubPost = onSnapshot(doc(db, 'forum_posts', postId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as ForumPost;
                setPost({ id: docSnap.id, ...(data as Omit<ForumPost, 'id'>) });
                setIsFollowing(data.followers?.includes(CURRENT_USER_ID) || false);
            } else {
                setPost(null); // Not found
            }
            setLoading(false);
        });

        // 2. Subscribe to Replies
        const q = query(
            collection(db, 'forum_replies'),
            where('postId', '==', postId),
            orderBy('createdAt', 'asc')
        );

        const unsubReplies = onSnapshot(q, (snapshot) => {
            setReplies(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Reply)));
        });

        return () => {
            unsubPost();
            unsubReplies();
        };
    }, [postId]);

    const handleToggleFollow = async () => {
        if (!postId || !post) return;
        const ref = doc(db, 'forum_posts', postId);
        if (isFollowing) {
            await updateDoc(ref, { followers: arrayRemove(CURRENT_USER_ID) });
        } else {
            await updateDoc(ref, { followers: arrayUnion(CURRENT_USER_ID) });
        }
    };

    const handlePostReply = async () => {
        if (!replyText.trim() || !postId) return;
        setIsSubmitting(true);

        // Optimistic UI Update
        const tempId = 'temp-' + Date.now();
        const optimisticReply: Reply = {
            id: tempId,
            postId,
            content: replyText,
            authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
            createdAt: new Date() // Local Date object
        };

        // Immediately show the reply
        setReplies(prev => [...prev, optimisticReply]);
        const textToSubmit = replyText; // Capture text
        setReplyText(''); // Clear input immediately

        // Scroll to bottom
        setTimeout(() => dummyRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        try {
            // Add Reply to Firestore
            await addDoc(collection(db, 'forum_replies'), {
                postId,
                content: textToSubmit,
                authorName: optimisticReply.authorName,
                createdAt: optimisticReply.createdAt
            });

            // Update Post Counters
            await updateDoc(doc(db, 'forum_posts', postId), {
                replyCount: increment(1)
            });

        } catch (error) {
            console.error("Error posting reply:", error);
            // Rollback on error (optional, but good practice)
            setReplies(prev => prev.filter(r => r.id !== tempId));
            setReplyText(textToSubmit); // Restore text
            alert("Failed to post reply.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const helperFormatTime = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading discussion...</div>;
    if (!post) return <div className="p-10 text-center text-gray-500">Discussion not found.</div>;

    return (
        <div className="w-full max-w-[1000px] mx-auto p-6 pb-40">

            {/* Nav */}
            <Button variant="ghost" className="mb-4 pl-0" onClick={() => router.back()} icon={<ArrowLeft />}>
                Back to Forum
            </Button>

            {/* Main Post Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
                <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 uppercase tracking-wide mb-2">
                                {post.topic}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <PersonCircle size={16} />
                                <span className="font-medium text-gray-700">{post.authorName}</span>
                                <span>•</span>
                                <span>{helperFormatTime(post.createdAt)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleToggleFollow}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${isFollowing
                                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {isFollowing ? <BellFill /> : <Bell />}
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                                <Share size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="prose max-w-none text-gray-800 mb-6 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                    </div>

                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {post.images.map((img, idx) => (
                                <a key={idx} href={img} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <img src={img} alt={`Attachment ${idx + 1}`} className="w-full h-40 object-cover" />
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Actions footer */}
                    <div className="flex items-center gap-6 pt-6 border-t border-gray-100 text-gray-500">
                        <button className="flex items-center gap-2 hover:text-purple-600 transition-colors">
                            <HandThumbsUp size={18} />
                            <span className="text-sm font-medium">{post.likes} Likes</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <Chat size={18} />
                            <span className="text-sm font-medium">{post.replyCount} Replies</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Replies Section */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Replies ({replies.length})</h3>

                <div className="space-y-4">
                    {replies.map(reply => (
                        <div key={reply.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                        {reply.authorName.charAt(0)}
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">{reply.authorName}</span>
                                </div>
                                <span className="text-xs text-gray-400">{helperFormatTime(reply.createdAt)}</span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                        </div>
                    ))}

                    {replies.length === 0 && (
                        <div className="text-center py-8 text-gray-400 italic">No replies yet. Be the first to share your thoughts!</div>
                    )}
                    <div ref={dummyRef} />
                </div>
            </div>

            {/* Post Reply Box */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-lg sticky bottom-6">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Post a Reply</h4>
                <div className="relative">
                    <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your reply here..."
                        className="w-full p-3 pr-12 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none outline-none"
                        rows={3}
                    />
                    <button
                        onClick={handlePostReply}
                        disabled={isSubmitting || !replyText.trim()}
                        className={`absolute bottom-3 right-3 p-2 rounded-full text-white transition-all shadow-md ${!replyText.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                        title="Send Reply"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>

        </div>
    );
}

export default function DiscussionPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DiscussionContent />
        </Suspense>
    );
}
