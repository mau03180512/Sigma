import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield, Mail, Lock, Github } from 'lucide-react';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUp } = useAuthStore();

  const handleGoogle = async () => {
    try {
      setError('');
      await signInWithGoogle();
      navigate('/chat');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/chat');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-sigma-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="glass rounded-2xl p-8 w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-sigma-accent/20 flex items-center justify-center mb-4 glow">
            <Shield className="w-8 h-8 text-sigma-accent" />
          </div>
          <h1 className="text-2xl font-bold text-sigma-text-primary">Sigma</h1>
          <p className="text-sigma-text-secondary text-sm mt-1">Elite AI Assistant</p>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full glass glass-hover rounded-lg py-3 px-4 flex items-center justify-center gap-3 text-sigma-text-primary transition-all duration-200 mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-sigma-glass-border" />
          <span className="text-sigma-text-secondary text-sm">or</span>
          <div className="flex-1 h-px bg-sigma-glass-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sigma-text-secondary" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-sigma-bg-secondary border border-sigma-glass-border rounded-lg py-3 pl-10 pr-4 text-sigma-text-primary placeholder:text-sigma-text-secondary focus:outline-none focus:border-sigma-accent transition-colors text-sm"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sigma-text-secondary" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-sigma-bg-secondary border border-sigma-glass-border rounded-lg py-3 pl-10 pr-4 text-sigma-text-primary placeholder:text-sigma-text-secondary focus:outline-none focus:border-sigma-accent transition-colors text-sm"
              required
            />
          </div>

          {error && (
            <p className="text-sigma-danger text-xs">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-sigma-accent hover:bg-sigma-accent-glow text-white rounded-lg py-3 font-medium transition-all duration-200 glow-hover text-sm"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-sigma-text-secondary">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-sigma-accent hover:text-sigma-accent-glow transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
