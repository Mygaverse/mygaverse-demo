'use client';

import Button from '@/components/scriptoplay/ui/Button';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';

export default function AccessPending() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center p-6">
      <div className="max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-white">You're on the list! 🚀</h1>
        <p className="text-gray-400">
          Thanks for signing up for Scriptoplay. We are currently in <strong>Closed Beta</strong>.
        </p>
        <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl">
           <p className="text-sm text-gray-300">
             Your account is pending approval. You will receive an email invitation once your access is granted.
           </p>
        </div>
        <Button variant="secondary" onClick={signOut}>Sign Out</Button>
      </div>
    </div>
  );
}
