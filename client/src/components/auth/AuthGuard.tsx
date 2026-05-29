import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Shield } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || showSplash) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-sigma-bg-primary gap-4">
        <div className="w-16 h-16 rounded-xl bg-sigma-accent/20 flex items-center justify-center glow">
          <Shield className="w-8 h-8 text-sigma-accent" />
        </div>
        <h1 className="text-2xl font-bold text-sigma-text-primary">Sigma</h1>
        <p className="text-sm text-sigma-text-secondary">Elite AI Assistant</p>
        <div className="flex gap-2 mt-4">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}