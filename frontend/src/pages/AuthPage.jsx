import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Cpu, Loader2 } from 'lucide-react';
import { signInEmail, signUpEmail, signInGoogle } from '../services/firebase.js';
import { useAuth } from '../store/index.js';

export default function AuthPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'login') await signInEmail(form.email, form.password);
      else await signUpEmail(form.email, form.password);
    } catch (err) { setError(err.message.replace('Firebase: ', '').replace(/\(.*\)\.?/, '').trim()); }
    setLoading(false);
  };

  const google = async () => {
    setError(''); setLoading(true);
    try { await signInGoogle(); } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-clay flex items-center justify-center shadow-sm">
            <Cpu size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">RealMind AI</span>
        </div>

        <div className="card px-6 py-7">
          <h1 className="text-base font-semibold text-gray-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-sand-400 mb-6">
            {mode === 'login' ? 'Sign in to continue' : 'Start building with RealMind'}
          </p>

          <button onClick={google} disabled={loading}
            className="btn-outline w-full mb-4 gap-2.5 justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-sand-200" />
            <span className="text-xs text-sand-400">or</span>
            <div className="flex-1 h-px bg-sand-200" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input type="email" value={form.email} required placeholder="Email"
              onChange={e => setForm({ ...form, email: e.target.value })} className="field" />
            <input type="password" value={form.password} required placeholder="Password" minLength={6}
              onChange={e => setForm({ ...form, password: e.target.value })} className="field" />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-sand-400 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
              className="text-clay hover:underline font-medium">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
