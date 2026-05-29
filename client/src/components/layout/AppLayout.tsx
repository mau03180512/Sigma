import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ModelSelector } from '../chat/ModelSelector';
import { Menu, Info, Share2 } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-sigma-bg-primary overflow-hidden">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="flex items-center justify-between px-4 h-16 border-b border-sigma-glass-border bg-sigma-bg-primary/50 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-sigma-glass-border transition-colors text-sigma-text-primary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col lg:hidden">
              <span className="text-sm font-semibold text-sigma-text-primary">Sigma</span>
              <span className="text-[10px] text-sigma-accent">Assistant</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModelSelector />
            <div className="h-6 w-px bg-sigma-glass-border mx-1 hidden sm:block" />
            <button className="p-2 rounded-lg hover:bg-sigma-glass-border transition-colors text-sigma-text-secondary hover:text-sigma-text-primary hidden sm:block">
              <Info className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-sigma-glass-border transition-colors text-sigma-text-secondary hover:text-sigma-text-primary hidden sm:block">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 relative overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
