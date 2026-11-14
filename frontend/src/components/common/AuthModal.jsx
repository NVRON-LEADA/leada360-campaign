import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Megaphone, Lock, Mail, User, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', inviteToken = null }) {
  const { login } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'accept_invite'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Accept invite fields
  const [token, setToken] = useState(inviteToken || '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
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
      const res = await api.users.acceptInvite(token.trim(), newPassword, firstName, lastName);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Account created successfully! You can now sign in.');
        setEmail(res.user?.email || '');
        setPassword('');
        setTimeout(() => {
          setMode('login');
        }, 1200);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to accept invitation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white text-center relative">
          <div className="w-12 h-12 bg-coral rounded-xl mx-auto flex items-center justify-center mb-3 shadow-md">
            <Megaphone size={24} className="stroke-[2.2] -rotate-12 text-white" />
          </div>
          <h2 className="text-lg font-bold">
            {mode === 'login' ? 'Sign In to LeadA360' : 'Accept Invitation & Set Password'}
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            {mode === 'login' 
              ? 'LeadA360 Enterprise Email Broadcast Platform' 
              : 'Complete your profile setup to join the team'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-700">
              <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ssr07j@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-coral hover:bg-red-600 disabled:opacity-60 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>Invited by a teammate?</span>
                <button
                  type="button"
                  onClick={() => { setMode('accept_invite'); setError(''); }}
                  className="text-coral hover:underline font-semibold"
                >
                  Set password with token
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAcceptInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Invitation Token / Code</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your invitation UUID token"
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Set Password</label>
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
                  className="w-full py-2.5 px-4 bg-coral hover:bg-red-600 disabled:opacity-60 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Activating Account...' : 'Set Password & Join'}
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-[11px] text-gray-500 hover:text-gray-800"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
