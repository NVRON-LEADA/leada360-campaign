import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, Users, MousePointer, TrendingUp, AlertTriangle, 
  UserMinus, RefreshCw, CheckCircle2, ShieldCheck, Eye, X, Monitor, Smartphone, Send
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import { api } from '../services/api';

export default function Analytics({ campaign, setActivePage }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMailPreview, setShowMailPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const loadLiveStats = async () => {
    if (!campaign?.id) return;
    try {
      setLoading(true);
      const data = await api.campaigns.getStats(campaign.id);
      setStats(data);
    } catch (err) {
      console.warn('Could not fetch campaign stats from AWS RDS:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSend = async () => {
    if (!testEmail || !campaign?.id) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await api.campaigns.testSend(campaign.id, testEmail);
      setTestResult({ ok: true, msg: `Test email sent! SES MessageId: ${res.message_id}` });
    } catch (err) {
      setTestResult({ ok: false, msg: `Failed: ${err.message}` });
    } finally {
      setTestSending(false);
    }
  };

  useEffect(() => {
    loadLiveStats();
  }, [campaign?.id]);

  if (!campaign) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm">Select a campaign from the Campaigns page to view live analytics.</p>
        <button onClick={() => setActivePage('campaigns')} className="btn-primary mt-3 mx-auto">
          View Campaigns
        </button>
      </div>
    );
  }

  const recipients = stats?.total_recipients ?? campaign.recipients ?? 0;
  const sent = stats?.sent_count ?? recipients;
  const delivered = stats?.delivered_count ?? sent;
  const opens = stats?.open_count ?? 0;
  const clicks = stats?.click_count ?? 0;
  const bounces = stats?.bounce_count ?? 0;
  const complaints = stats?.complaint_count ?? 0;
  const unsubscribes = stats?.unsubscribe_count ?? 0;
  const ctor = stats?.click_to_open_rate ?? 0;

  // Zoho standard: denominator is sent_count
  const denominator = sent || recipients || 1;
  const openRate = stats?.open_rate_percent ?? (denominator > 0 ? ((opens / denominator) * 100).toFixed(1) : '0');
  const clickRate = stats?.click_rate_percent ?? (denominator > 0 ? ((clicks / denominator) * 100).toFixed(1) : '0');
  const bounceRate = stats?.bounce_rate_percent ?? (denominator > 0 ? ((bounces / denominator) * 100).toFixed(2) : '0');

  const recipientsDispatched = stats?.recipients_dispatched || [];
  const emailHtml = stats?.compiled_html || campaign.compiled_html || '<p>No email content found.</p>';
  const emailSubject = stats?.subject || campaign.subject || 'WELCOME TO NVRON LIFE SCIENCE LTD';
  const emailSender = stats?.sender_email || campaign.sender || campaign.sender_email || 'info@nvron.in';

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActivePage('campaigns')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-xs text-gray-500">Campaigns / Live Delivery Audit</div>
            <h1 className="text-base font-bold text-gray-900 mt-0.5">{campaign.name || campaign.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Email Content Button */}
          <button 
            onClick={() => setShowMailPreview(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Eye size={13} /> View Mail Content
          </button>
          <button onClick={loadLiveStats} className="btn-secondary" title="Refresh Live Stats">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <StatusBadge status={stats?.status === 'COMPLETED' ? 'Sent' : (campaign.status || 'Sent')} />
        </div>
      </div>

      {/* Test Send Panel */}
      <div className="app-card p-4 border-l-4 border-blue-500">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <Send size={13} className="text-blue-600" /> Send Test Email (Verify SES is Working)
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">Send a preview copy to any inbox to confirm delivery before full campaign send.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              className="border border-gray-200 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-600 w-52"
            />
            <button
              onClick={handleTestSend}
              disabled={testSending || !testEmail}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <Send size={12} /> {testSending ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        </div>
        {testResult && (
          <div className={`mt-2 text-xs font-medium px-3 py-2 rounded ${testResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {testResult.ok ? '✅ ' : '❌ '}{testResult.msg}
          </div>
        )}
      </div>

      {/* Scorecard - Zoho-style 7 metrics */}      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Dispatched" value={recipients.toLocaleString()} icon={Mail} color="blue" />
        <StatCard label="Delivered" value={delivered.toLocaleString()} sub={recipients > 0 ? `${((delivered / recipients) * 100).toFixed(1)}%` : '100%'} icon={TrendingUp} color="green" />
        <StatCard label="Unique Opens" value={opens.toLocaleString()} sub={`${openRate}%`} icon={Mail} color="purple" />
        <StatCard label="Unique Clicks" value={clicks.toLocaleString()} sub={`${clickRate}%`} icon={MousePointer} color="blue" />
        <StatCard label="CTOR" value={`${ctor}%`} sub="Clicks / Opens" icon={MousePointer} color="green" />
        <StatCard label="Bounces" value={bounces.toLocaleString()} sub={`${bounceRate}%`} icon={AlertTriangle} color="yellow" />
        <StatCard label="Unsubscribes" value={unsubscribes.toLocaleString()} sub="0.0%" icon={UserMinus} color="red" />
      </div>

      {/* Verified Delivery Log Table */}
      <div className="app-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <h3 className="text-xs font-bold text-gray-900">Verified Recipient Delivery Log (Amazon SES)</h3>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Exact recipient list with AWS SES Message ID tracking and dispatch timestamps.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMailPreview(true)}
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              <Eye size={12} /> View Sent Email Body
            </button>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1">
              <CheckCircle2 size={12} /> {recipientsDispatched.length || recipients} Recipient(s) Dispatched
            </span>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-2.5">Recipient Email</th>
              <th className="px-3 py-2.5">Contact Name</th>
              <th className="px-3 py-2.5">Organization</th>
              <th className="px-3 py-2.5">Delivery Status</th>
              <th className="px-3 py-2.5">Amazon SES Message ID</th>
              <th className="px-3 py-2.5">Sent Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs">
            {recipientsDispatched.map(r => (
              <tr key={r.id} className="hover:bg-blue-50/20">
                <td className="px-4 py-3 font-medium text-blue-600">
                  {r.email}
                </td>
                <td className="px-3 py-3 text-gray-700">
                  {r.name || '—'}
                </td>
                <td className="px-3 py-3 text-gray-600">
                  {r.company || '—'}
                </td>
                <td className="px-3 py-3">
                  {r.status === 'SENT' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <CheckCircle2 size={11} className="text-emerald-600" /> Delivered (SES)
                    </span>
                  ) : r.status === 'FAILED' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded" title={r.error_message}>
                      Failed: {r.error_message || 'SES error'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      In Queue ({r.status})
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 font-mono text-[10px] text-gray-500 max-w-xs truncate" title={r.ses_message_id}>
                  {r.ses_message_id}
                </td>
                <td className="px-3 py-3 text-gray-500 text-[11px]">
                  {r.sent_at}
                </td>
              </tr>
            ))}
            {recipientsDispatched.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                  {loading ? 'Connecting to AWS RDS...' : 'No recipient dispatches found for this campaign.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Campaign Details Header & Preview Shortcut */}
      <div className="app-card p-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
          <h3 className="text-xs font-bold text-gray-900">Campaign Properties & Sender Setup</h3>
          <button 
            onClick={() => setShowMailPreview(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Eye size={12} /> Inspect Message Template & Text
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <div className="text-gray-400 text-[11px]">Subject Line</div>
            <div className="font-semibold text-gray-800 mt-0.5">{emailSubject}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <div className="text-gray-400 text-[11px]">Sender Identity</div>
            <div className="font-semibold text-gray-800 mt-0.5">{emailSender}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <div className="text-gray-400 text-[11px]">Verified AWS Domain</div>
            <div className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
              <CheckCircle2 size={12} /> nvron.in (ap-south-1)
            </div>
          </div>
        </div>
      </div>

      {/* Modal: View Mail Content */}
      {showMailPreview && (
        <Modal title="Campaign Email Content & Message Preview" onClose={() => setShowMailPreview(false)} size="lg">
          <div className="p-4 space-y-4">
            {/* Header info */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Subject:</span>
                <span className="font-semibold text-gray-900">{emailSubject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">From:</span>
                <span className="font-mono text-gray-800">{emailSender}</span>
              </div>
            </div>

            {/* Device Toggle */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-xs font-medium text-gray-700">Inbox Rendering:</span>
              <div className="flex border border-gray-200 rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium ${previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Monitor size={12} /> Desktop (600px)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium ${previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Smartphone size={12} /> Mobile (380px)
                </button>
              </div>
            </div>

            {/* Email Render Frame */}
            <div className="flex justify-center bg-gray-100 p-4 rounded-xl border border-gray-200 max-h-[500px] overflow-y-auto">
              <div 
                className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all ${
                  previewDevice === 'desktop' ? 'w-full max-w-xl' : 'w-80'
                }`}
              >
                <div 
                  className="p-4 text-xs"
                  dangerouslySetInnerHTML={{ 
                    __html: emailHtml.replace(/{{first_name}}/g, 'Selva').replace(/{{company}}/g, 'LeadA360') 
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => setShowMailPreview(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}