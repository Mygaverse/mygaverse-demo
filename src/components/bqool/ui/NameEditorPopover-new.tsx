'use client';

import React, { useState } from 'react';
import { SimplePopover } from '@/components/bqool/ui/SimplePopover';
import { Button } from '@/components/bqool/ui/Button';

interface NameEditorPopoverProps {
  initialValue: string;
  onSave: (newValue: string) => Promise<void>;
  label: string;
}

export function NameEditorPopover({ initialValue, onSave, label }: NameEditorPopoverProps) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onSave(value);
    setLoading(false);
    setOpen(false); // Close popover
  };

  return (
    <SimplePopover
      trigger={
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-2">
          Edit
        </button>
      }
      content={
        <div className="p-3 w-64">
          <label className="block text-xs font-bold text-gray-700 mb-2">{label}</label>
          <input 
            type="text" 
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-3 focus:outline-none focus:border-blue-500"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      }
    />
  );
}