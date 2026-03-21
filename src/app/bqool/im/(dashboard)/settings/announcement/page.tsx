'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, Plus, Pencil, Archive, Trash } from 'react-bootstrap-icons';
import { collection, query, orderBy, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Button } from '@/components/bqool/ui/Button';
import { Announcement } from '@/components/bqool/im/types';
import { DynamicTable, ColumnDef } from '@/components/bqool/tables/DynamicTable';
import { Badge } from '@/components/bqool/ui/Badge';

export default function AnnouncementPage() {
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Announcement[];
            setAnnouncements(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleArchive = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'archived' ? 'published' : 'archived';
        if (!confirm(`Mark this announcement as ${newStatus}?`)) return;

        try {
            await updateDoc(doc(db, 'announcements', id), { status: newStatus });
            fetchAnnouncements();
        } catch (e) {
            console.error(e);
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to permanently delete this?")) return;
        try {
            await deleteDoc(doc(db, 'announcements', id));
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const columns: ColumnDef<Announcement>[] = [
        {
            key: 'title',
            header: 'Title',
            render: (row) => (
                <div>
                    <div className="font-bold text-gray-900">{row.title}</div>
                    <div className="text-xs text-gray-400 line-clamp-1">{row.content}</div>
                </div>
            )
        },
        {
            key: 'type',
            header: 'Type',
            width: '120px',
            align: 'center',
            render: (row) => {
                const colors: Record<string, 'blue' | 'yellow' | 'red' | 'gray'> = {
                    update: 'blue', changelog: 'gray', alert: 'red'
                };
                return <Badge variant={colors[row.type] || 'gray'}>{row.type.toUpperCase()}</Badge>;
            }
        },
        {
            key: 'status',
            header: 'Status',
            width: '120px',
            align: 'center',
            render: (row) => {
                const isPub = row.status === 'published';
                return (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${isPub ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                        {row.status}
                    </span>
                );
            }
        },
        {
            key: 'createdAt',
            header: 'Date',
            width: '150px',
            render: (row) => {
                const d = row.createdAt?.seconds ? new Date(row.createdAt.seconds * 1000) : new Date(row.createdAt);
                return <span className="text-sm text-gray-600">{d.toLocaleDateString()}</span>
            }
        },
        {
            key: 'id', // Actions
            header: 'Actions',
            width: '150px',
            align: 'center',
            render: (row) => (
                <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="secondary" onClick={() => router.push(`/im/settings/announcement/editor?id=${row.id}`)}>
                        <Pencil size={12} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleArchive(row.id, row.status)}>
                        <Archive size={12} />
                    </Button>
                    <Button size="sm" variant="secondary" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(row.id)}>
                        <Trash size={12} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="w-full max-w-[1200px] mx-auto p-6">

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Megaphone className="text-orange-600" /> Announcements
                    </h1>
                    <p className="text-gray-500 mt-1">Manage system-wide notifications and news updates.</p>
                </div>
                <Button variant="primary" className="gap-2" onClick={() => router.push('/im/settings/announcement/editor?id=new')}>
                    <Plus size={20} /> New Announcement
                </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading...</div>
                ) : (
                    <DynamicTable data={announcements} columns={columns} />
                )}
                {!loading && announcements.length === 0 && (
                    <div className="p-8 text-center text-gray-400">No announcements found.</div>
                )}
            </div>

        </div>
    );
}
