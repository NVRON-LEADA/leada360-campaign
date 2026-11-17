import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Copy, RefreshCw, Send, Mail } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import { api } from '../services/api';

const TABS = ['All', 'Sent', 'Scheduled', 'Processing', 'Draft', 'A/B Testing'];

export default function Campaigns({ onCreateCampaign, onEditCampaign, setActivePage, setSelectedCampaign }) {
  const [campaignList, setCampaignList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await api.campaigns.list({ page_size: 1000 });
      const rawList = Array.isArray(data) ? data : (data?.results || []);
      // Map API format if necessary
      const formatted = rawList.map(c => {
        // Zoho standard: rates calculated against sent_count (actual emails dispatched)
        // Fall back to total_recipients if sent_count is 0
        const sent = c.sent_count || c.total_recipients || 0;
        return {
          id: c.id,
          name: c.title || c.name,
          subject: c.subject,
          sender: c.sender_email || c.sender,
          status: c.status === 'COMPLETED' ? 'Sent' : (c.status || 'Draft').charAt(0).toUpperCase() + (c.status || 'draft').slice(1).toLowerCase(),
          recipients: sent || c.recipients || 0,
          openRate: sent > 0 ? Number(((c.open_count / sent) * 100).toFixed(1)) : 0,
          clickRate: sent > 0 ? Number(((c.click_count / sent) * 100).toFixed(1)) : 0,
          bounceRate: sent > 0 ? Number(((c.bounce_count / sent) * 100).toFixed(2)) : 0,
          sentAt: c.status === 'SCHEDULED' && c.scheduled_at
            ? `Scheduled: ${new Date(c.scheduled_at).toLocaleString()}`
            : (c.started_at ? new Date(c.started_at).toLocaleString() : c.sentAt || null),
          isAB: c.campaign_type === 'AB_TEST' || c.isAB || false,
          // Pass through raw counts for Analytics page
          open_count: c.open_count,
          click_count: c.click_count,
          bounce_count: c.bounce_count,
          sent_count: c.sent_count,
          total_recipients: c.total_recipients,
          compiled_html: c.compiled_html,
          sender_email: c.sender_email,
        };
      });
      setCampaignList(formatted);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    // Auto-poll every 5 seconds if any campaign is currently Processing
    const interval = setInterval(() => {
      api.campaigns.list({ page_size: 1000 }).then(data => {
        const rawList = Array.isArray(data) ? data : (data?.results || []);
        const hasProcessing = rawList.some(c => c.status === 'PROCESSING');
        if (hasProcessing) {
          const formatted = rawList.map(c => {
            const sent = c.sent_count || c.total_recipients || 0;
            return {
              id: c.id,
              name: c.title,
              subject: c.subject,
              sender: c.sender_email || c.sender,
              status: c.status === 'COMPLETED' ? 'Sent' : (c.status || 'Draft').charAt(0).toUpperCase() + (c.status || 'draft').slice(1).toLowerCase(),
              recipients: sent || c.recipients || 0,
              openRate: sent > 0 ? Number(((c.open_count / sent) * 100).toFixed(1)) : 0,
              clickRate: sent > 0 ? Number(((c.click_count / sent) * 100).toFixed(1)) : 0,
              bounceRate: sent > 0 ? Number(((c.bounce_count / sent) * 100).toFixed(1)) : 0,
              type: c.campaign_type || 'Regular',
              date: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Today',
              sentAt: c.started_at ? new Date(c.started_at).toLocaleString() : null,
              isAB: c.campaign_type === 'AB_TEST',
              open_count: c.open_count,
              click_count: c.click_count,
              bounce_count: c.bounce_count,
              sent_count: c.sent_count,
              total_recipients: c.total_recipients,
              compiled_html: c.compiled_html,
              sender_email: c.sender_email,
              target_lists: c.target_lists,
              attachment: c.attachment,
              attachment_name: c.attachment_name,
              attachment_url: c.attachment_url,
            };
          });
          setCampaignList(formatted);
        }
      }).catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Reset to first page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  const handleLaunchCampaign = async (campaignOrId, e) => {
    e.stopPropagation();
    const id = typeof campaignOrId === 'object' ? campaignOrId.id : campaignOrId;
    try {
      await api.campaigns.send(id);
      alert('Campaign dispatch initiated in background!');
      fetchCampaigns();
    } catch (err) {
      alert(`Cannot send campaign: ${err.message}`);
    }
  };

  const handleDeleteCampaign = async (id, e) => {
    if (e) e.stopPropagation();
    setOpenMenu(null);
    if (!window.confirm('Are you sure you want to delete this campaign? This cannot be undone.')) {
      return;
    }
    try {
      await api.campaigns.delete(id);
      fetchCampaigns();
    } catch (err) {
      alert(`Error deleting campaign: ${err.message}`);
    }
  };

  const handleCloneCampaign = async (campaign, e) => {
    if (e) e.stopPropagation();
    setOpenMenu(null);
    try {
      // Fetch full campaign details so target_lists and template content are preserved
      const full = await api.campaigns.get(campaign.id).catch(() => null);
      const targetLists = full?.target_lists || full?.target_list_details?.map(l => l.id) || [];

      await api.campaigns.create({
        title: `${campaign.name} (Copy)`,
        subject: full?.subject || campaign.subject || 'Copy of campaign',
        preheader: full?.preheader || '',
        sender_email: full?.sender_email || campaign.sender || 'info@nvron.in',
        sender_name: full?.sender_name || 'NVRON Life Science',
        compiled_html: full?.compiled_html || campaign.compiled_html || '',
        mjml_content: full?.mjml_content || '',
        target_lists: targetLists,
      });
      fetchCampaigns();
    } catch (err) {
      alert(`Error cloning campaign: ${err.message}`);
    }
  };

  const handleEdit = async (campaign, e) => {
    if (e) e.stopPropagation();
    setOpenMenu(null);
    try {
      // Fetch full campaign details from backend so target_lists, email content, etc. are populated
      const full = await api.campaigns.get(campaign.id).catch(() => null);
      const campaignToEdit = full || campaign;
      if (onEditCampaign) {
        onEditCampaign(campaignToEdit);
      } else {
        onCreateCampaign();
      }
    } catch {
      if (onEditCampaign) onEditCampaign(campaign);
    }
  };

  const filtered = campaignList.filter(c => {
    const matchTab = activeTab === 'All' || c.status.toLowerCase() === activeTab.toLowerCase() || (activeTab === 'A/B Testing' && c.isAB);
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.subject || '').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // Calculate paginated slice
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedCampaigns = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Campaigns</div>
          <h1 className="text-base font-semibold text-gray-900 mt-0.5">All Campaigns</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCampaigns} className="btn-secondary" title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onCreateCampaign} className="btn-primary">
            <Plus size={13} /> Create Campaign
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="app-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-2">
          <div className="flex">
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={activeTab === t ? 'app-tab-active' : 'app-tab'}>
                {t}
                <span className="ml-1 text-[10px] text-gray-400">
                  ({t === 'All' ? campaignList.length : t === 'A/B Testing' ? campaignList.filter(c => c.isAB).length : campaignList.filter(c => c.status.toLowerCase() === t.toLowerCase()).length})
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 py-2 pr-2">
            <div className="flex items-center gap-1.5 border border-gray-200 rounded px-2 py-1">
              <Search size={12} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search campaigns..." className="outline-none text-xs w-40 text-gray-700" />
            </div>
            <button className="btn-secondary"><Filter size={12} /> Filter</button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="w-8 px-4 py-2"><input type="checkbox" className="w-3 h-3" /></th>
                {['Campaign Name', 'Status', 'Recipients', 'Open %', 'Click %', 'Bounce %', 'Sent At', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`camp-skeleton-${idx}`} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-3"><div className="w-3.5 h-3.5 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-3.5 bg-blue-100 rounded w-44"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-emerald-100 rounded-full w-14"></div></td>
                    <td className="px-3 py-3"><div className="h-3.5 bg-gray-100 rounded w-16"></div></td>
                    <td className="px-3 py-3"><div className="h-3 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-3 py-3"><div className="h-3 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-3 py-3"><div className="h-3 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-3 py-3"><div className="h-3 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-3 py-3"><div className="w-4 h-4 bg-gray-200 rounded"></div></td>
                  </tr>
                ))
              ) : (
                paginatedCampaigns.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer group">
                    <td className="px-4 py-2.5"><input type="checkbox" className="w-3 h-3" /></td>
                    <td className="px-3 py-2.5" onClick={() => { setSelectedCampaign(c); setActivePage('analytics'); }}>
                      <div className="text-xs font-medium text-blue-600 hover:underline">{c.name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-xs">{c.subject}</div>
                    </td>
                    <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2.5 text-xs text-gray-700 font-medium">{(c.recipients || 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-700">
                      {c.status.toLowerCase() === 'draft' ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className="text-green-700 font-semibold">{c.openRate}%</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-700">
                      {c.status.toLowerCase() === 'draft' ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className="text-blue-700 font-semibold">{c.clickRate}%</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-700">
                      {c.status.toLowerCase() === 'draft' ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className="text-gray-600">{c.bounceRate}%</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{c.sentAt || '—'}</td>
                    <td className="px-3 py-2.5 relative">
                      <div className="flex items-center gap-1">
                        {c.status.toLowerCase() === 'draft' && (
                          <button
                            onClick={(e) => handleLaunchCampaign(c, e)}
                            className="px-2 py-0.5 text-[10px] font-medium bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                            title="Launch now"
                          >
                            <Send size={10} /> Send
                          </button>
                        )}
                        <button onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === c.id ? null : c.id); }}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                      {openMenu === c.id && (
                        <div 
                          className="absolute right-4 top-8 bg-white border border-gray-200 rounded shadow-lg py-1 z-20 w-36 text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          <button onClick={() => { setSelectedCampaign(c); setActivePage('analytics'); setOpenMenu(null); }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                            <Eye size={12} /> View Report
                          </button>
                          <button onClick={(e) => handleEdit(c, e)}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                            <Edit size={12} /> Edit
                          </button>
                          <button onClick={(e) => handleCloneCampaign(c, e)}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                            <Copy size={12} /> Clone
                          </button>
                          <button onClick={(e) => handleDeleteCampaign(c.id, e)}
                            className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">No campaigns found</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Create your first campaign to begin outreach.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={size => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          itemName="campaigns"
        />
      </div>
    </div>
  );
}
