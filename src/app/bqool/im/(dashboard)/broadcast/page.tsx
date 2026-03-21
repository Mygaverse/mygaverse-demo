'use client';

import React, { useState } from 'react';
import { DashboardShell } from '@/components/bqool/layout/DashboardShell'; // Assuming you have an IM shell, or use AdminGuard directly
import { AdminGuard } from '@/components/bqool/auth/AdminGuard';
import { Button } from '@/components/bqool/ui/Button';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/bqool/firebase'; // Ensure you export 'functions' from your firebase config
import { Send, Eye, Megaphone } from 'react-bootstrap-icons';

export default function BroadcastPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSend = async (testMode: boolean) => {
    if (!subject.trim() || !message.trim()) {
        alert("Please enter both a subject and a message.");
        return;
    }
    
    if (!testMode && !confirm("⚠️ Are you sure you want to send this to ALL users?")) {
        return;
    }

    setLoading(true);
    setStatus(null);

    try {
      // Call the Cloud Function
      const sendBroadcast = httpsCallable(functions, 'sendBroadcastEmail');
      const result: any = await sendBroadcast({ 
          subject, 
          message, 
          testMode 
      });

      if (result.data.success) {
          setStatus({ 
              type: 'success', 
              msg: testMode 
                  ? `Test email sent successfully!` 
                  : `Broadcast sent to ${result.data.count} users!`
          });
          if (!testMode) {
              setSubject('');
              setMessage('');
          }
      }
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', msg: "Failed to send: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="p-8 max-w-4xl mx-auto">
        
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Megaphone size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Broadcast Center</h1>
                <p className="text-gray-500">Send updates and news to your user base.</p>
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            
            {status && (
                <div className={`mb-6 p-4 rounded-md border flex items-center gap-2 ${
                    status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    {status.type === 'success' ? '✓' : '✕'} {status.msg}
                </div>
            )}

            <div className="space-y-6">
                
                {/* Subject Line */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject Line</label>
                    <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="e.g. New Features Released: AI Bidding is here!"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>

                {/* Message Body */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Message Body</label>
                    <textarea 
                        className="w-full border border-gray-300 rounded-md px-4 py-3 h-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        placeholder="Write your update here... (Basic HTML tags like <br> are supported by the backend logic)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-2 text-right">
                        {message.length} characters
                    </p>
                </div>

                {/* Action Bar */}
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        <span className="font-bold">Note:</span> Emails are sent via Nodemailer.
                    </div>
                    
                    <div className="flex gap-3">
                        <Button 
                            variant="secondary" 
                            onClick={() => handleSend(true)}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <Eye /> Send Test Preview
                        </Button>
                        
                        <Button 
                            onClick={() => handleSend(false)}
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <Send /> Send to All Users
                        </Button>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </AdminGuard>
  );
}