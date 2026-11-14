import { useState, useRef, useEffect } from 'react';
import { 
  Megaphone, Plus, Search, Bell, HelpCircle, Settings, MoreVertical, 
  User, Shield, LogOut, LogIn, ExternalLink, X, ChevronRight, Info, 
  Users, CheckCircle2, AlertCircle, Eye, MousePointerClick, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import AuthModal from '../common/AuthModal';

export default function Topbar({ onCreateCampaign, setActivePage }) {
  const { currentUser, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Fetch live notifications from database / telemetry API
  const fetchLiveNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await api.telemetry.getNotifications();
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 20000); // Poll every 20s for live updates
    return () => clearInterval(interval);
  }, []);

  // Close menus on click outside
  const topbarRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (topbarRef.current && !topbarRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowHelp(false);
        setShowProfile(false);
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread && !notificationsRead).length;

  // Format relative time helper
  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  const displayName = currentUser?.first_name 
    ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
    : (currentUser?.email ? currentUser.email.split('@')[0] : 'Guest User');

  const initials = currentUser?.first_name
    ? `${currentUser.first_name[0]}${currentUser.last_name ? currentUser.last_name[0] : ''}`.toUpperCase()
    : (currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'SS');

  const roleLabel = currentUser?.role === 'super_admin' || currentUser?.is_superuser
    ? 'Super Admin'
    : (currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Admin');

  return (
    <>
      <header ref={topbarRef} className="bg-white border-b border-gray-200 h-13 px-4 flex items-center justify-between flex-shrink-0 z-20 relative select-none">
        {/* Left Brand Area */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setActivePage && setActivePage('dashboard')}
        >
          <div className="text-coral flex items-center justify-center">
            <Megaphone size={22} className="stroke-[2.2] -rotate-12" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900 tracking-tight">Campaigns</span>
          </div>
        </div>

        {/* Right Action Icons Area */}
        <div className="flex items-center gap-3 relative">
          {/* Orange Plus Quick Action */}
          <button
            onClick={onCreateCampaign}
            title="Create New Campaign"
            className="bg-coral hover:bg-red-600 text-white w-7 h-7 rounded flex items-center justify-center shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>

          {/* Search Input toggle */}
          <div className="relative">
            {showSearch ? (
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded px-2 py-0.5">
                <Search size={14} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search across campaigns, lists..." 
                  autoFocus
                  className="text-xs bg-transparent outline-none w-48 text-gray-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (setActivePage) setActivePage('campaigns');
                      setShowSearch(false);
                    }
                  }}
                />
                <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowSearch(true)} 
                title="Search" 
                className="text-gray-500 hover:text-gray-800 p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Search size={18} strokeWidth={1.8} />
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowHelp(false);
                setShowProfile(false);
                setShowMoreMenu(false);
              }} 
              title="Notifications" 
              className="text-gray-500 hover:text-gray-800 p-1.5 rounded hover:bg-gray-100 relative transition-colors cursor-pointer"
            >
              <Bell size={18} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-coral rounded-full ring-2 ring-white animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-10 w-84 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800">
                    <Bell size={14} className="text-coral" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-coral text-white text-[10px] px-1.5 py-0.2 rounded-full font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          await api.telemetry.markNotificationsAsRead();
                          setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                          setNotificationsRead(true);
                          setShowNotifications(false); // Close dropdown immediately when done
                        } catch (e) {
                          console.error(e);
                        }
                      }} 
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      title="Mark all as read and close"
                    >
                      Mark all as done
                    </button>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                      title="Close"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      No notifications yet. Dispatches & activities will show here.
                    </div>
                  ) : (
                    notifications.map(n => {
                      const isError = n.status === 'error';
                      const isOpened = n.type === 'opened';
                      const isClicked = n.type === 'clicked';
                      return (
                        <div 
                          key={n.id} 
                          className={`p-3 hover:bg-gray-50/80 transition-colors flex items-start gap-2.5 ${n.unread ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {isError ? (
                              <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                <AlertCircle size={12} />
                              </div>
                            ) : isOpened ? (
                              <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                <Eye size={12} />
                              </div>
                            ) : isClicked ? (
                              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <MousePointerClick size={12} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 size={12} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`font-semibold truncate text-[11px] ${isError ? 'text-red-700' : 'text-gray-900'}`}>
                                {n.title}
                              </span>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                {formatTime(n.time)}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                              {n.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between text-[11px]">
                    <button
                      onClick={async () => {
                        await api.telemetry.clearAllNotifications();
                        setNotifications([]);
                        setShowNotifications(false);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Help & Support */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowHelp(!showHelp);
                setShowNotifications(false);
                setShowProfile(false);
                setShowMoreMenu(false);
              }} 
              title="Help & Support" 
              className="text-gray-500 hover:text-gray-800 p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <HelpCircle size={18} strokeWidth={1.8} />
            </button>

            {showHelp && (
              <div className="absolute right-0 top-10 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-gray-100 font-semibold text-gray-800 flex items-center gap-1.5">
                  <Info size={14} className="text-blue-600" /> Internal System Guide
                </div>
                <a 
                  href="https://aws.amazon.com/ses/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-gray-700"
                >
                  <span>AWS SES Production Limits</span>
                  <ExternalLink size={12} className="text-gray-400" />
                </a>
                <button 
                  onClick={() => { setActivePage && setActivePage('deliverability'); setShowHelp(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-gray-700"
                >
                  <span>Deliverability & IP Reputation</span>
                  <ChevronRight size={12} className="text-gray-400" />
                </button>
                <button 
                  onClick={() => { setActivePage && setActivePage('users'); setShowHelp(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-blue-600 font-medium"
                >
                  <span>User Management & Invites</span>
                  <ChevronRight size={12} className="text-blue-500" />
                </button>
              </div>
            )}
          </div>

          {/* Clean Profile Avatar & Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setShowProfile(true)}
            onMouseLeave={() => setShowProfile(false)}
          >
            {/* Topbar Avatar Circle */}
            <div 
              onClick={() => setShowProfile(!showProfile)}
              className="w-8 h-8 rounded-full bg-blue-600 border border-blue-700 flex items-center justify-center text-white ml-1 cursor-pointer font-semibold text-xs shadow-xs hover:ring-2 hover:ring-coral/40 transition-all" 
              title={currentUser ? `${displayName}` : 'Account'}
            >
              {initials}
            </div>

            {/* Clean Dropdown Card */}
            {showProfile && (
              <div 
                className="absolute right-0 top-9 w-60 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100"
              >
                {currentUser ? (
                  <>
                    {/* Header: Name, Email & Role */}
                    <div className="p-3.5 border-b border-gray-100 bg-white">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {displayName}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate mt-0.5" title={currentUser.email}>
                        {currentUser.email}
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          <Shield size={10} /> {roleLabel}
                        </span>
                      </div>
                    </div>

                    {/* Nav Links */}
                    <div className="py-1">
                      <button 
                        onClick={() => { setActivePage && setActivePage('users'); setShowProfile(false); }}
                        className="w-full text-left px-3.5 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Users size={14} className="text-gray-400" />
                        <span>User Management</span>
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-gray-100 p-1.5">
                      <button 
                        onClick={() => { 
                          logout(); 
                          setShowProfile(false); 
                        }}
                        className="w-full text-left px-3 py-1.5 rounded hover:bg-red-50 text-red-600 font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut size={13} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 mx-auto flex items-center justify-center mb-2 font-bold text-xs">
                      ??
                    </div>
                    <div className="font-semibold text-gray-800 text-xs">Guest User</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 mb-3">Please sign in to continue</div>
                    <button
                      onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); setShowProfile(false); }}
                      className="w-full py-1.5 bg-coral hover:bg-red-600 text-white rounded text-xs font-semibold"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal for Login / Accepting Invites */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
