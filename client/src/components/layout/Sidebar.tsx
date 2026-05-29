import { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { Plus, Trash2, LogOut, MessageSquare, Shield } from 'lucide-react';

interface SidebarProps {
  onClose: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { conversations, activeConversationId, loadConversations, createNewConversation, deleteConversation, setActiveConversation } = useChatStore();
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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
    <div className="h-full flex flex-col bg-sigma-bg-secondary border-r border-sigma-glass-border">
      <div className="p-4 border-b border-sigma-glass-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-sigma-accent/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-sigma-accent" />
          </div>
          <span className="font-semibold text-sigma-text-primary">Sigma</span>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full glass glass-hover rounded-lg py-2.5 px-3 flex items-center gap-2 text-sigma-text-primary text-sm transition-all duration-200 glow-hover"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-sigma-text-secondary text-xs text-center py-8">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={`w-full glass rounded-lg p-3 text-left transition-all duration-200 group ${
                activeConversationId === conv.id
                  ? 'border-sigma-accent/50 bg-sigma-accent/10'
                  : 'glass-hover'
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-sigma-text-secondary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-sigma-text-primary truncate">{conv.title}</p>
                  <p className="text-xs text-sigma-text-secondary mt-0.5">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-sigma-danger/20 text-sigma-danger transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="p-4 border-t border-sigma-glass-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-sigma-accent/20 flex items-center justify-center">
                <span className="text-xs text-sigma-accent font-medium">
                  {user?.email?.[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-sigma-text-primary truncate">{user?.displayName || user?.email}</span>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-sigma-glass-border transition-colors text-sigma-text-secondary hover:text-sigma-danger"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
