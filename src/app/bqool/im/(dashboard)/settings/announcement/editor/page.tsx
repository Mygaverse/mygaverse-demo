'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/bqool/firebase';
import { doc, getDoc, setDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/bqool/ui/Button';
import { Announcement, AnnouncementType } from '@/components/bqool/im/types';
import { ArrowLeft } from 'react-bootstrap-icons';
import { useAuth } from '@/app/bqool/context/AuthContext';

function EditorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    // Get ID from Query Param
    const id = searchParams.get('id');
    const isNew = !id || id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<AnnouncementType>('update');
    const [status, setStatus] = useState('published');

    useEffect(() => {
        if (!isNew && id) {
            const loadData = async () => {
                const docRef = doc(db, 'announcements', id);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data() as Announcement;
                    setTitle(data.title);
                    setContent(data.content);
                    setType(data.type);
                    setStatus(data.status);
                }
                setLoading(false);
            };
            loadData();
        } else {
            setLoading(false);
        }
    }, [id, isNew]);

    const handleSave = async () => {
        if (!title || !content) {
            alert('Please fill in required fields');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title,
                content,
                type,
                status,
                updatedAt: Timestamp.now(),
                // Only set these on creation
                ...(isNew && {
                    createdAt: Timestamp.now(),
                    createdBy: user?.uid || 'admin',
                    authorName: user?.email || 'Admin'
                })
            };

            if (isNew) {
                await addDoc(collection(db, 'announcements'), payload);
            } else {
                await setDoc(doc(db, 'announcements', id!), payload, { merge: true });
            }
            router.push('/im/settings/announcement');
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="max-w-[800px] mx-auto p-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
            >
                <ArrowLeft /> Back to List
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-8">
                {isNew ? 'New Announcement' : 'Edit Announcement'}
            </h1>

            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-6">

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. System Maintenance Scheduled"
                    />
                </div>

                {/* Type & Status Row */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="update">Update</option>
                            <option value="changelog">Changelog</option>
                            <option value="alert">Alert</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Enter details here..."
                    />
                    <p className="text-xs text-gray-400 mt-1">Plain text supported currently.</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="secondary" onClick={() => router.back()} disabled={saving}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Announcement'}
                    </Button>
                </div>

            </div>
        </div>
    );
}

export default function AnnouncementEditorPage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <EditorContent />
        </Suspense>
    );
}
