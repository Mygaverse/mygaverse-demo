'use client';

import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
    value: string;
    onChange: (content: string) => void;
    className?: string;
}

export default function QuillEditor({ value, onChange, className }: QuillEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillInstance = useRef<Quill | null>(null);
    const isInternalChange = useRef(false);

    useEffect(() => {
        if (editorRef.current && !quillInstance.current) {
            quillInstance.current = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: {
                        container: [
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            [{ 'color': [] }, { 'background': [] }],
                            ['link', 'image'],
                            ['clean']
                        ],
                        handlers: {
                            image: () => {
                                const input = document.createElement('input');
                                input.setAttribute('type', 'file');
                                input.setAttribute('accept', 'image/*');
                                input.click();

                                input.onchange = async () => {
                                    const file = input.files?.[0];
                                    if (file) {
                                        // Check size: 300KB limit
                                        if (file.size > 300 * 1024) {
                                            alert('Image is too large for this demo. Please use an image under 300KB.');
                                            return;
                                        }

                                        // Convert to base64
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            const range = quillInstance.current?.getSelection(true);
                                            if (range && quillInstance.current) {
                                                quillInstance.current.insertEmbed(range.index, 'image', e.target?.result);
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                };
                            }
                        }
                    }
                }
            });

            quillInstance.current.on('text-change', () => {
                if (quillInstance.current) {
                    const html = quillInstance.current.root.innerHTML;
                    if (html === '<p><br></p>') {
                        if (value !== '') {
                            isInternalChange.current = true;
                            onChange('');
                        }
                    } else {
                        isInternalChange.current = true;
                        onChange(html);
                    }
                }
            });
        }
    }, []); // Run once on mount

    // Update editor content when value prop changes externally
    useEffect(() => {
        if (quillInstance.current) {
            const currentContent = quillInstance.current.root.innerHTML;
            const normalizedValue = value || '';
            const normalizedCurrent = currentContent === '<p><br></p>' ? '' : currentContent;

            if (normalizedValue !== normalizedCurrent && !isInternalChange.current) {
                // Save selection only if editor has focus to avoid "addRange" errors
                const hasFocus = quillInstance.current.hasFocus();
                let range = null;
                if (hasFocus) {
                    try {
                        range = quillInstance.current.getSelection();
                    } catch (e) { /* Ignore selection errors during external update */ }
                }

                quillInstance.current.root.innerHTML = normalizedValue;

                // Restore selection if we had focus
                if (hasFocus) {
                    try {
                        if (range) {
                            quillInstance.current.setSelection(range);
                        } else {
                            // If lost position, go to end
                            quillInstance.current.setSelection(quillInstance.current.getLength());
                        }
                    } catch (e) {
                        console.warn('Quill selection restore failed:', e);
                    }
                }
            }
            isInternalChange.current = false;
        }
    }, [value]);

    return (
        <div className={`quill-editor-container ${className}`}>
            <div ref={editorRef} style={{ height: '100%' }} />
        </div>
    );
}
