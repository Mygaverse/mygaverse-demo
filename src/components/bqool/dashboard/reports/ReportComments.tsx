'use client';

import React, { useState } from 'react';
import { TypeBold, TypeItalic, TypeUnderline, ListUl, ListOl, Image as ImageIcon, Code, ArrowCounterclockwise, Star } from 'react-bootstrap-icons';
import { Button } from '@/components/bqool/ui/Button';

export const ReportComments = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [comment, setComment] = useState("");

    const ToolbarButton = ({ icon: Icon }: { icon: any }) => (
        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
            <Icon size={14} />
        </button>
    );

    return (
        <div className="mt-8 bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e2e2] flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800">Comments</h3>
                <div className="flex items-center gap-2">
                    {/* Mock Toolbar */}
                    <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-1">
                        <ToolbarButton icon={TypeBold} />
                        <ToolbarButton icon={TypeItalic} />
                        <ToolbarButton icon={TypeUnderline} />
                    </div>
                    <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-1">
                        <ToolbarButton icon={ListUl} />
                        <ToolbarButton icon={ListOl} />
                    </div>
                    <div className="flex items-center gap-1">
                        <ToolbarButton icon={ImageIcon} />
                        <ToolbarButton icon={Code} />
                    </div>
                </div>
            </div>

            <div className="p-6 min-h-[180px] bg-white relative group">
                {!isEditing && comment.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 gap-4">
                        <span className="text-gray-300 text-sm">Type something to add insights to this report...</span>
                        <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>+ Add Comments</Button>
                    </div>
                ) : (
                    <textarea 
                        className="w-full h-full min-h-[150px] outline-none text-gray-700 text-sm resize-none"
                        placeholder="Type your analysis here..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        autoFocus
                    />
                )}
            </div>

            <div className="px-6 py-3 border-t border-[#e2e2e2] bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-400">{2950 - comment.length} remaining characters</span>
                <Button variant="secondary" size="sm" icon={<Star size={14} />}>Save as Template</Button>
            </div>
        </div>
    );
};