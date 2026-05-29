import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield, Mail, Lock, ChevronRight, Github, Chrome } from 'lucide-react';

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
    <div className="min-h-screen bg-sigma-bg-primary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sigma-accent/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sigma-accent/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-grid opacity-[0.05]" />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="flex flex-col items-center mb-10 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-sigma-accent/20 flex items-center justify-center mb-6 glow border border-sigma-accent/30 shadow-2xl shadow-sigma-accent/20">
            <Shield className="w-10 h-10 text-sigma-accent" />
          </div>
          <h1 className="text-4xl font-black text-sigma-text-primary tracking-tighter mb-2">SIGMA</h1>
          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-sigma-accent/50" />
            <p className="text-sigma-text-secondary text-xs font-bold uppercase tracking-[0.2em]">Elite AI Core</p>
            <span className="h-px w-8 bg-sigma-accent/50" />
          </div>
        </div>

        <div className="glass-card p-8 animate-slide-up border-sigma-accent/20 shadow-2xl relative">
          {/* Accent bar at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-sigma-accent rounded-b-full shadow-[0_0_15px_rgba(108,92,231,0.5)]" />
          
          <h2 className="text-xl font-bold text-sigma-text-primary mb-2 text-center">
            {isSignUp ? 'Initialize Account' : 'Welcome Back'}
          </h2>
          <p className="text-sigma-text-secondary text-sm text-center mb-8">
            {isSignUp ? 'Join the elite AI-powered network.' : 'Securely access your workspace.'}
          </p>

          <button
            onClick={handleGoogle}
            className="w-full glass glass-hover rounded-xl py-3.5 px-4 flex items-center justify-center gap-3 text-sigma-text-primary font-medium transition-all duration-300 mb-6 hover:translate-y-[-2px] border-sigma-glass-border/50 group"
          >
            <Chrome className="w-5 h-5 text-sigma-accent group-hover:scale-110 transition-transform" />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sigma-glass-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#12121a] px-3 text-sigma-text-secondary font-medium tracking-widest">or email access</span>
            </div>
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-sigma-text-secondary uppercase tracking-wider ml-1">Terminal ID</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sigma-text-secondary group-focus-within:text-sigma-accent transition-colors" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-sigma-bg-primary/50 border border-sigma-glass-border rounded-xl py-3.5 pl-12 pr-4 text-sigma-text-primary placeholder:text-sigma-text-secondary/50 focus:outline-none focus:border-sigma-accent focus:ring-1 focus:ring-sigma-accent/20 transition-all text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-sigma-text-secondary uppercase tracking-wider ml-1">Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sigma-text-secondary group-focus-within:text-sigma-accent transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-sigma-bg-primary/50 border border-sigma-glass-border rounded-xl py-3.5 pl-12 pr-4 text-sigma-text-primary placeholder:text-sigma-text-secondary/50 focus:outline-none focus:border-sigma-accent focus:ring-1 focus:ring-sigma-accent/20 transition-all text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-sigma-danger/10 border border-sigma-danger/20 rounded-lg p-3 animate-fade-in">
                <p className="text-sigma-danger text-xs text-center font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-sigma-accent hover:bg-sigma-accent-glow text-white rounded-xl py-4 font-bold transition-all duration-300 glow-hover text-sm shadow-lg shadow-sigma-accent/25 flex items-center justify-center gap-2 group mt-2"
            >
              {isSignUp ? 'Create System Account' : 'Authenticate'}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-sigma-text-secondary font-medium">
            {isSignUp ? 'Already registered?' : 'New operator?'}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-sigma-accent hover:text-sigma-accent-glow font-bold transition-colors underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-6 animate-fade-in delay-300">
          <button className="text-sigma-text-secondary hover:text-sigma-text-primary text-xs flex items-center gap-1.5 transition-colors">
            <Github className="w-4 h-4" />
            Open Source
          </button>
          <span className="w-1 h-1 bg-sigma-glass-border rounded-full self-center" />
          <p className="text-sigma-text-secondary text-[10px] font-medium self-center">
            &copy; 2026 SIGMA PROTOCOL
          </p>
        </div>
      </div>
    </div>
  );
}
