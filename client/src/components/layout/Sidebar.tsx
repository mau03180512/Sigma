import { useEffect, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { Plus, Trash2, LogOut, MessageSquare, Shield, Settings, Search } from 'lucide-react';

interface SidebarProps {
  onClose: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { conversations, activeConversationId, loadConversations, createNewConversation, deleteConversation, setActiveConversation } = useChatStore();
  const { user, signOut } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = () => {
    createNewConversation();
    onClose();
  };

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
  };

  return (
    <div className="h-full flex flex-col bg-sigma-bg-secondary border-r border-sigma-glass-border shadow-2xl">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sigma-accent/20 flex items-center justify-center glow">
              <Shield className="w-5 h-5 text-sigma-accent" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sigma-text-primary tracking-tight">Sigma</span>
              <span className="text-[10px] text-sigma-accent font-medium uppercase tracking-wider">v1.0.4 Premium</span>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-sigma-glass-border transition-colors text-sigma-text-secondary">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full bg-sigma-accent hover:bg-sigma-accent-glow text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 glow-hover shadow-lg shadow-sigma-accent/20"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sigma-text-secondary group-focus-within:text-sigma-accent transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-sigma-bg-primary/50 border border-sigma-glass-border rounded-lg py-2 pl-9 pr-3 text-xs text-sigma-text-primary placeholder:text-sigma-text-secondary focus:outline-none focus:border-sigma-accent/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold text-sigma-text-secondary uppercase tracking-widest">Recent Chats</span>
        </div>
        
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-sigma-glass-border flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-sigma-text-secondary opacity-20" />
            </div>
            <p className="text-sigma-text-secondary text-xs">
              {searchQuery ? 'No matching chats found.' : 'No history yet.<br/>Start a new mission.'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={`w-full group flex items-start gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                activeConversationId === conv.id
                  ? 'bg-sigma-accent/10 border border-sigma-accent/30'
                  : 'hover:bg-sigma-glass-border border border-transparent'
              }`}
            >
              <div className={`mt-0.5 p-1.5 rounded-lg ${
                activeConversationId === conv.id ? 'bg-sigma-accent/20 text-sigma-accent' : 'bg-sigma-bg-primary text-sigma-text-secondary'
              }`}>
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  activeConversationId === conv.id ? 'text-sigma-text-primary' : 'text-sigma-text-secondary group-hover:text-sigma-text-primary'
                }`}>
                  {conv.title}
                </p>
                <p className="text-[10px] text-sigma-text-secondary mt-0.5 opacity-60">
                  {new Date(conv.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-sigma-danger/20 text-sigma-danger transition-all duration-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))
        )}
      </div>

      <div className="p-4 mt-auto border-t border-sigma-glass-border bg-sigma-bg-primary/30">
        <div className="flex items-center justify-between p-2 rounded-xl glass">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-lg" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-sigma-accent text-white flex items-center justify-center font-bold text-sm">
                  {user?.email?.[0].toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-sigma-success border-2 border-sigma-bg-secondary rounded-full" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-sigma-text-primary truncate">
                {user?.displayName || user?.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-sigma-text-secondary truncate">Online</span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-sigma-danger/10 text-sigma-text-secondary hover:text-sigma-danger transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
