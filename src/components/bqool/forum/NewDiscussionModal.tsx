'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/bqool/ui/Modal';
import { Button } from '@/components/bqool/ui/Button';
import { Image as ImageIcon, Type, Link as LinkIcon, X } from 'react-bootstrap-icons';

interface NewDiscussionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; topic: string; content: string; images: string[] }) => Promise<void>;
    topics: { id: string; label: string }[];
}

export function NewDiscussionModal({ isOpen, onClose, onSubmit, topics }: NewDiscussionModalProps) {
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState(topics[0]?.id || 'general');
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showImageInput, setShowImageInput] = useState(false);
    const [imageUrl, setImageUrl] = useState('');

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsSubmitting(true);
        try {
            await onSubmit({ title, topic, content, images });
            handleClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setContent('');
        setImages([]);
        setShowImageInput(false);
        setImageUrl('');
        onClose();
    };

    const handleAddImage = () => {
        if (imageUrl.trim()) {
            setImages([...images, imageUrl.trim()]);
            setImageUrl('');
            setShowImageInput(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Start a New Discussion" width="max-w-2xl">
            <div className="space-y-6">

                {/* Topic Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Topic</label>
                    <div className="flex flex-wrap gap-2">
                        {topics.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTopic(t.id)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${topic === t.id
                                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>

                {/* Rich Editor (Simulated) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-purple-500 focus-within:border-purple-500">
                        {/* Toolbar */}
                        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex items-center gap-4">
                            <button className="text-gray-500 hover:text-gray-700" title="Bold"><Type size={16} /></button>
                            <button
                                className={`text-gray-500 hover:text-gray-700 ${showImageInput ? 'text-purple-600' : ''}`}
                                onClick={() => setShowImageInput(!showImageInput)}
                                title="Add Image URL"
                            >
                                <ImageIcon size={16} />
                            </button>
                            <button className="text-gray-500 hover:text-gray-700" title="Link"><LinkIcon size={16} /></button>
                        </div>

                        {/* Image Input Popover */}
                        {showImageInput && (
                            <div className="bg-gray-100 p-2 border-b border-gray-300 flex gap-2">
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    placeholder="Paste image URL..."
                                    className="flex-1 text-xs px-2 py-1 rounded border border-gray-300"
                                />
                                <Button size="sm" variant="secondary" onClick={handleAddImage}>Add</Button>
                            </div>
                        )}

                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={6}
                            placeholder="Share your thoughts, questions, or ideas..."
                            className="w-full p-3 border-0 focus:ring-0 resize-none outline-none block"
                        />

                        {/* Image Preview Area */}
                        {images.length > 0 && (
                            <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2 flex-wrap">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative group w-20 h-20 rounded overflow-hidden border border-gray-200 bg-white">
                                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-0 right-0 p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || !title || !content}>
                        {isSubmitting ? 'Posting...' : 'Post Discussion'}
                    </Button>
                </div>

            </div>
        </Modal>
    );
}
