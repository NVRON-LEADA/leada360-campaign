import { useState, useEffect } from 'react';
import {
  Upload, Plus, ArrowRight, CheckCircle2, Circle, Users, Sparkles, Send, Shield, Copy, Check
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard({ onCreateCampaign, setActivePage }) {
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [viewMode, setViewMode] = useState('onboarding');
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [metrics, setMetrics] = useState({
    totalSent: 0,
    deliveryRate: 100,
    avgOpenRate: 0,
    avgClickRate: 0,
    bounceRate: 0,
    spamRate: 0,
    totalContacts: 0,
    totalCampaigns: 0,
  });
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    async function fetchDashboardMetrics() {
      try {
        setLoading(true);
        const res = await api.campaigns.getDashboardOverview();
        if (res?.stats) {
          setMetrics(res.stats);
        }
        if (res?.feed) {
          setFeed(res.feed);
        }
      } catch (err) {
        console.error('Failed to load live metrics from AWS RDS:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardMetrics();
  }, []);

  const steps = [
    { id: 0, title: 'Add Contacts', subtitle: 'Upload your contacts spreadsheet or manage subscriber lists.' },
    { id: 1, title: 'Create a campaign', subtitle: 'Design and send regular, A/B test or bulk dispatches.' },
    { id: 2, title: 'Automate user journey', subtitle: 'Set up automated email drip triggers for leads and signups.' },
    { id: 3, title: 'Invite your team', subtitle: 'Collaborate with your marketing and sales operations teams.' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Switcher Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode('onboarding')}
            className={`pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
              viewMode === 'onboarding'
                ? 'border-coral text-coral'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Getting Started Checklist
          </button>
          <button
            onClick={() => setViewMode('performance')}
            className={`pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
              viewMode === 'performance'
                ? 'border-coral text-coral'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Enterprise Telemetry & Analytics
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setActivePage('deliverability')} className="btn-secondary text-xs">
            <Shield size={12} className="text-emerald-600" /> SES Health
          </button>
          <button onClick={onCreateCampaign} className="btn-coral text-xs">
            <Plus size={13} strokeWidth={2.5} /> Create Campaign
          </button>
        </div>
      </div>

      {viewMode === 'onboarding' ? (
        <div className="space-y-6">
          {/* Greeting Header with Handshake */}
          <div className="flex items-center gap-4 pt-1">
            <div className="w-13 h-13 rounded-full bg-amber-100/80 border border-amber-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
              🤝
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Hey {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : (currentUser?.email ? currentUser.email.split('@')[0] : 'Admin')}, good to have you on board!
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete the checklist below to get the most from Campaigns.
              </p>
            </div>
          </div>

          {/* 2-Column Onboarding Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
            {/* Left Stepper Column */}
            <div className="md:col-span-4 lg:col-span-4 border-r border-gray-100 p-6 flex flex-col justify-between bg-white">
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Get started with Campaigns</h2>
                  <div className="text-xs text-gray-400 mt-1">0 out of 4 Completed</div>

                  {/* 4 Segment Progress Bars */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                    <div className="h-1 bg-gray-200 rounded-full"></div>
                    <div className="h-1 bg-gray-200 rounded-full"></div>
                    <div className="h-1 bg-gray-200 rounded-full"></div>
                    <div className="h-1 bg-gray-200 rounded-full"></div>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-1.5 pt-2">
                  {steps.map((s) => {
                    const isSelected = activeStep === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveStep(s.id)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-peach text-coral font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-coral flex-shrink-0"></span>
                        ) : (
                          <Circle size={12} className="text-gray-300 stroke-[2] flex-shrink-0" />
                        )}
                        <span>{s.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Support Tip */}
              <div className="pt-6 border-t border-gray-100 text-[11px] text-gray-400">
                Need assistance setting up? <span className="text-coral font-medium cursor-pointer hover:underline">Contact Migration Support</span>
              </div>
            </div>

            {/* Right Active Step Detail Column */}
            <div className="md:col-span-8 lg:col-span-8 p-6 flex flex-col justify-between">
              {activeStep === 0 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Add Contacts</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Upload your contacts spreadsheet or manage your subscriber directories.
                    </p>
                  </div>

                  {/* Large Import Dropzone */}
                  <div
                    onClick={() => setActivePage('contacts')}
                    className="bg-peach-light border-2 border-dashed border-rose-200 rounded-xl p-8 text-center cursor-pointer hover:border-coral hover:bg-rose-50/50 transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-rose-100 flex items-center justify-center text-coral group-hover:scale-105 transition-transform">
                      <Upload size={22} strokeWidth={2} />
                    </div>
                    <div className="text-sm font-bold text-coral group-hover:underline">
                      Upload CSV or Excel File
                    </div>
                    <p className="text-xs text-gray-500 max-w-md">
                      Drag and drop your file here, or click to browse. The supported file types are CSV, XLS, and XLSX and the file size must be less than 25MB.
                    </p>
                  </div>

                  {/* Quick Action Shortcuts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div
                      onClick={() => setActivePage('contacts')}
                      className="p-3.5 border border-gray-200 rounded-lg hover:border-coral cursor-pointer transition-all bg-white flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Users size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-800">Manage Lists & Segments</div>
                        <div className="text-[11px] text-gray-500">Group contacts by engagement behavior</div>
                      </div>
                    </div>
                    <div
                      onClick={() => setActivePage('contacts')}
                      className="p-3.5 border border-gray-200 rounded-lg hover:border-coral cursor-pointer transition-all bg-white flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-800">Suppression Registry</div>
                        <div className="text-[11px] text-gray-500">View unsubscribes, bounces & spam filters</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Create a Campaign</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Launch email broadcasts with AWS SES enterprise delivery.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={onCreateCampaign}
                      className="border border-gray-200 rounded-lg p-4 hover:border-coral cursor-pointer transition-all bg-white"
                    >
                      <div className="text-coral font-bold text-xs mb-1">Standard Broadcast</div>
                      <p className="text-[11px] text-gray-500">Curate templates, select lists and dispatch to inboxes.</p>
                    </div>
                    <div
                      onClick={onCreateCampaign}
                      className="border border-gray-200 rounded-lg p-4 hover:border-coral cursor-pointer transition-all bg-white"
                    >
                      <div className="text-blue-600 font-bold text-xs mb-1">A/B Testing Campaign</div>
                      <p className="text-[11px] text-gray-500">Test subjects, sender names, and template variations.</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button onClick={onCreateCampaign} className="btn-coral text-xs">
                      <Plus size={13} strokeWidth={2.5} /> Launch 5-Step Campaign Wizard
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Automate User Journey</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Create behavioral triggers, drip welcome series, and condition branches.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-xs font-semibold text-gray-800">Visual Flow Preview</div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      New Contact Joins List → Send Welcome Email → Wait 2 Days → Check Open Status
                    </div>
                  </div>
                  <button onClick={() => setActivePage('automation')} className="btn-coral text-xs">
                    Open Automation Journey Canvas →
                  </button>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Invite Your Team</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Internal platform access. Invited users set their own password and get access to campaigns, contacts & analytics.
                    </p>
                  </div>

                  {inviteResult && (
                    <div className={`p-3 rounded-lg text-xs ${inviteResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      <div className="font-semibold">{inviteResult.message}</div>
                      {inviteResult.token && (
                        <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between">
                          <span className="font-mono text-[11px] truncate max-w-[280px]">
                            Token: {inviteResult.token}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(inviteResult.token);
                              setCopiedToken(true);
                              setTimeout(() => setCopiedToken(false), 2000);
                            }}
                            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            {copiedToken ? <Check size={12} /> : <Copy size={12} />}
                            {copiedToken ? 'Copied' : 'Copy Token'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!inviteEmail) return;
                      setInviteSending(true);
                      setInviteResult(null);
                      try {
                        const res = await api.users.invite(inviteEmail, inviteRole, currentUser?.email);
                        setInviteResult({
                          success: true,
                          message: `Invitation generated for ${inviteEmail}! Share the token below to set their password.`,
                          token: res.invitation?.id
                        });
                        setInviteEmail('');
                      } catch (err) {
                        setInviteResult({
                          success: false,
                          message: err.message || 'Failed to send invite'
                        });
                      } finally {
                        setInviteSending(false);
                      }
                    }} 
                    className="flex flex-wrap gap-2"
                  >
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="border border-gray-200 rounded px-3 py-1.5 text-xs flex-1 min-w-[200px] outline-none focus:border-coral"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="border border-gray-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-coral bg-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="marketer">Marketer</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="member">Member</option>
                    </select>
                    <button type="submit" disabled={inviteSending} className="btn-coral text-xs">
                      {inviteSending ? 'Inviting...' : 'Send Invite'}
                    </button>
                  </form>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Manage all invited users & roles in Team settings</span>
                    <button 
                      type="button"
                      onClick={() => setActivePage('users')}
                      className="text-coral hover:underline font-semibold"
                    >
                      View All Users & Invites →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Performance & Telemetry View */
        <div className="space-y-5">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Emails Sent" value={metrics.totalSent.toLocaleString()} sub="All Time" color="blue" highlight />
            <StatCard label="Delivery Rate" value={`${metrics.deliveryRate}%`} sub="AWS SES Benchmark" color="green" />
            <StatCard label="Avg Open Rate" value={`${metrics.avgOpenRate}%`} sub="Unique opens" color="purple" />
            <StatCard label="Avg Click Rate" value={`${metrics.avgClickRate}%`} sub="Tracked redirects" color="blue" />
            <StatCard label="Bounce Rate" value={`${metrics.bounceRate}%`} sub="Safety: < 0.5%" color="yellow" />
            <StatCard label="Spam Complaint" value={`${metrics.spamRate}%`} sub="Cap: < 0.10%" color="green" />
          </div>

          {/* Real-time Activity Feed from AWS RDS */}
          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <div>
                <h3 className="text-xs font-bold text-gray-900">Real-Time Dispatch & Telemetry Stream (AWS RDS)</h3>
                <p className="text-[11px] text-gray-500">Live feed of opens, clicks, and AWS SES events</p>
              </div>
              <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded border border-green-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Stream
              </span>
            </div>

            {feed.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No activity yet. Send a campaign or click a tracked link to see real-time events appear here!
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {feed.map((item, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-gray-800">{item.email}</div>
                      <div className="text-[11px] text-gray-500">{item.action}</div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={item.status} />
                      <div className="text-[10px] text-gray-400 mt-0.5">{item.occurred_at}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
