import { AuthProvider } from '@/app/scriptoplay/context/AuthContext';
import { AppContextProvider } from '@/app/scriptoplay/context/AppContext';
import { ReactNode } from 'react';

export default function ScriptoplayLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthProvider>
      <AppContextProvider>
        {children}
      </AppContextProvider>
    </AuthProvider>
  );
}
