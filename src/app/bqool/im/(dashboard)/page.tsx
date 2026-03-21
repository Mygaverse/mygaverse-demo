'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IMPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/bqool/im/home');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen text-gray-500">
      Redirecting to Home...
    </div>
  );
}