import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Megaphone, Lock, Mail, User, ShieldCheck, ArrowRight, 
  CheckCircle2, AlertCircle, KeyRound, Sparkles, Shield
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'accept_invite'
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Accept invite fields
  const [token, setToken] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.users.acceptInvite(token.trim(), newPassword, firstName.trim(), lastName.trim());
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Account activated successfully! Logging you in...');
        // Auto log in with the new credentials
        const loginRes = await login(res.user?.email || token.trim(), newPassword);
        if (!loginRes.success) {
          setEmail(res.user?.email || '');
          setMode('login');
          setSuccessMsg('Account created! Please sign in with your password.');
        }
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to accept invitation');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#081D34] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-coral/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-[#0B2545] to-[#133E68] p-7 text-white text-center">
          <div className="w-14 h-14 bg-coral rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg ring-4 ring-white/10">
            <Megaphone size={28} className="stroke-[2.2] -rotate-12 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">LeadA360 Campaigns</h1>
          <p className="text-xs text-gray-300 mt-1">
            {mode === 'login' 
              ? 'Sign in to access your campaigns, lists & dispatch tools' 
              : 'Accept invitation to join internal software workspace'}
          </p>
        </div>

        {/* Content Box */}
        <div className="p-7">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email / Username
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ssr07j@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">Password</label>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-coral hover:bg-red-600 disabled:opacity-60 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Invited by a teammate?</span>
                <button
                  type="button"
                  onClick={() => { setMode('accept_invite'); setError(''); }}
                  className="text-coral hover:underline font-semibold cursor-pointer"
                >
                  Set password with token →
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAcceptInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Invitation Token / Code</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste invite UUID token"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-coral"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-coral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Create Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-coral"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-coral hover:bg-red-600 disabled:opacity-60 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Activating Account...' : 'Set Password & Join'}
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
          <Shield size={12} className="text-gray-400" />
          <span>Internal Enterprise Software Authentication</span>
        </div>
      </div>
    </div>
  );
}

