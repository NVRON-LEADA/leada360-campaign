import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, Upload, Filter, Users, RefreshCw, Trash2, Edit, 
  CheckCircle2, AlertCircle, FileSpreadsheet, Download, X, ArrowRight, Eye
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { api } from '../services/api';

const TABS = ['Subscribers', 'Lists', 'Suppression List'];

// Robust CSV parser supporting quotes, commas, escapes
function parseCSV(text) {
  const lines = [];
  let row = [''];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (row.length > 1 || row[0] !== '') {
        lines.push(row.map(f => f.trim()));
      }
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }

  if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
    lines.push(row.map(f => f.trim()));
  }

  if (lines.length < 2) return [];
  const headers = lines[0].map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    if (values.every(v => v === '')) continue;
    const obj = {};
    headers.forEach((h, index) => {
      obj[h] = values[index] !== undefined ? values[index] : '';
    });
    rows.push(obj);
  }
  return rows;
}

export default function Contacts() {
  const [activeTab, setActiveTab] = useState('Subscribers');
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);

  const [subscribers, setSubscribers] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [suppressed, setSuppressed] = useState([]);

  // View contacts modal state for a list
  const [viewingList, setViewingList] = useState(null);
  const [listContactsLoading, setListContactsLoading] = useState(false);
  const [listContactsData, setListContactsData] = useState([]);
  const [listContactSearch, setListContactSearch] = useState('');
  const [listModalPage, setListModalPage] = useState(1);
  const [listModalPageSize, setListModalPageSize] = useState(25);

  const filteredListContacts = useMemo(() => {
    if (!listContactSearch.trim()) return listContactsData;
    const q = listContactSearch.trim().toLowerCase();
    return listContactsData.filter(c => {
      const email = (c.email || '').toLowerCase();
      const name = `${c.first_name || c.firstName || ''} ${c.last_name || c.lastName || ''}`.toLowerCase();
      const company = (c.company || '').toLowerCase();
      return email.includes(q) || name.includes(q) || company.includes(q);
    });
  }, [listContactsData, listContactSearch]);

  // Form states for adding contact
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [selectedListId, setSelectedListId] = useState('');

  // Form states for creating list
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  // Meaningful Import state (File Upload & Mapping)
  const [importFile, setImportFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    phone: '',
  });
  const [importTargetListId, setImportTargetListId] = useState('');
  const [importStep, setImportStep] = useState(1); // 1: Select List & File, 2: Map & Preview
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Pagination states for Subscribers and Suppression List
  const [subscribersPage, setSubscribersPage] = useState(1);
  const [subscribersPageSize, setSubscribersPageSize] = useState(25);
  const [suppressedPage, setSuppressedPage] = useState(1);
  const [suppressedPageSize, setSuppressedPageSize] = useState(25);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, lData, sData] = await Promise.all([
        api.contacts.list({ page_size: 50000 }),
        api.lists.list({ page_size: 1000 }),
        api.suppression.list({ page_size: 50000 }),
      ]);

      const rawContacts = Array.isArray(cData) ? cData : (cData?.results || []);
      const rawLists = Array.isArray(lData) ? lData : (lData?.results || []);
      const rawSuppressed = Array.isArray(sData) ? sData : (sData?.results || []);

      setSubscribers(rawContacts.map(c => ({
        id: c.id,
        email: c.email,
        firstName: c.first_name || c.firstName || '',
        lastName: c.last_name || c.lastName || '',
        company: c.company || '',
        status: (c.status || 'Active').charAt(0).toUpperCase() + (c.status || 'active').slice(1).toLowerCase(),
        list: c.list_name || c.list || 'General',
        source: c.source || 'Direct API',
        createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString() : c.createdAt || 'Today',
      })));

      setContactLists(rawLists.map(l => ({
        id: l.id,
        name: l.name,
        count: typeof l.subscriber_count === 'number' ? l.subscriber_count : (l.total_subscribers ?? 0),
        description: l.description || 'Target audience segment',
        created: l.created_at ? new Date(l.created_at).toLocaleDateString() : l.created || 'Recent',
      })));

      setSuppressed(rawSuppressed.map(s => ({
        email: s.email,
        reason: s.reason,
        type: s.reason?.includes('BOUNCE') ? 'Bounce' : s.reason?.includes('COMPLAINT') ? 'Complaint' : 'Unsubscribe',
        date: s.suppressed_at ? new Date(s.suppressed_at).toLocaleDateString() : s.date || 'Recent',
      })));
    } catch (err) {
      console.error('Failed to load audience data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenListContacts = async (list) => {
    setViewingList(list);
    setListContactsLoading(true);
    setListContactSearch('');
    setListModalPage(1);
    try {
      const data = await api.contacts.list({ list_id: list.id, page_size: 10000 });
      const contactsList = Array.isArray(data) ? data : (data?.results || []);
      setListContactsData(contactsList);
    } catch (err) {
      console.error('Failed to load list contacts:', err);
      // Fallback to local filter if query param fails
      const fallback = subscribers.filter(s => s.list === list.name);
      setListContactsData(fallback);
    } finally {
      setListContactsLoading(false);
    }
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!newEmail) return;
    try {
      const payload = {
        email: newEmail.trim().toLowerCase(),
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        company: newCompany.trim(),
      };
      if (selectedListId) {
        payload.list_id = selectedListId;
      }
      await api.contacts.create(payload);
      setShowAddContact(false);
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
      setNewCompany('');
      setSelectedListId('');
      loadData();
    } catch (err) {
      alert(`Error creating contact: ${err.message}`);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName) return;
    try {
      await api.lists.create({
        name: newListName,
        description: newListDescription,
      });
      setShowCreateList(false);
      setNewListName('');
      setNewListDescription('');
      loadData();
    } catch (err) {
      alert(`Error creating list: ${err.message}`);
    }
  };

  const handleDeleteContact = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this contact permanently?')) return;
    try {
      await api.contacts.delete(id);
      loadData();
    } catch (err) {
      alert(`Error deleting contact: ${err.message}`);
    }
  };

  const handleDeleteList = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this list? Contacts assigned will remain in the master directory.')) return;
    try {
      await api.lists.delete(id);
      loadData();
    } catch (err) {
      alert(`Error deleting list: ${err.message}`);
    }
  };

  // Handle CSV/Excel File Processing
  const handleFileProcess = (file) => {
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const parsed = parseCSV(content);

      if (!parsed || parsed.length === 0) {
        alert('Could not detect contacts in this file. Please ensure it has a header row with at least an "email" column.');
        return;
      }

      setParsedRows(parsed);
      const headers = Object.keys(parsed[0]);
      setCsvHeaders(headers);

      // Intelligent Auto-mapping detection
      const autoMap = { email: '', first_name: '', last_name: '', company: '', phone: '' };
      headers.forEach(h => {
        const lower = h.toLowerCase().replace(/[^a-z]/g, '');
        if (lower.includes('email') || lower === 'mail') autoMap.email = h;
        else if (lower.includes('first') || lower === 'fname') autoMap.first_name = h;
        else if (lower.includes('last') || lower === 'lname' || lower === 'surname') autoMap.last_name = h;
        else if (lower.includes('name') && !autoMap.first_name) autoMap.first_name = h;
        else if (lower.includes('comp') || lower.includes('org') || lower.includes('business')) autoMap.company = h;
        else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel')) autoMap.phone = h;
      });

      setFieldMappings(autoMap);
      setImportStep(2);
    };
    reader.readAsText(file);
  };

  const handleCompleteImport = async () => {
    if (!fieldMappings.email) {
      alert('Please select which column represents the Email address.');
      return;
    }

    setIsImporting(true);
    try {
      const formattedContacts = parsedRows.map(row => ({
        email: row[fieldMappings.email] || '',
        first_name: fieldMappings.first_name ? row[fieldMappings.first_name] : '',
        last_name: fieldMappings.last_name ? row[fieldMappings.last_name] : '',
        company: fieldMappings.company ? row[fieldMappings.company] : '',
        phone: fieldMappings.phone ? row[fieldMappings.phone] : '',
      })).filter(c => c.email && c.email.includes('@'));

      if (formattedContacts.length === 0) {
        alert('No valid email records found to import.');
        setIsImporting(false);
        return;
      }

      const res = await api.contacts.bulkImport(formattedContacts, importTargetListId || null);
      alert(`Success! Successfully imported ${res.imported || formattedContacts.length} contacts into LeadA360.`);
      setShowImport(false);
      setImportStep(1);
      setImportFile(null);
      setParsedRows([]);
      loadData();
    } catch (err) {
      alert(`Failed to import contacts: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const filtered = subscribers.filter(c =>
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  );

  // Pagination for Subscribers
  const totalSubscribersPages = Math.ceil(filtered.length / subscribersPageSize) || 1;
  const paginatedSubscribers = filtered.slice(
    (subscribersPage - 1) * subscribersPageSize,
    subscribersPage * subscribersPageSize
  );

  // Pagination for Suppressed
  const filteredSuppressed = suppressed.filter(s => (s.email || '').toLowerCase().includes(search.toLowerCase()));
  const totalSuppressedPages = Math.ceil(filteredSuppressed.length / suppressedPageSize) || 1;
  const paginatedSuppressed = filteredSuppressed.slice(
    (suppressedPage - 1) * suppressedPageSize,
    suppressedPage * suppressedPageSize
  );

  // Reset page when search or tab changes
  useEffect(() => {
    setSubscribersPage(1);
    setSuppressedPage(1);
  }, [search, activeTab]);

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Audience & Subscribers</div>
          <h1 className="text-base font-semibold text-gray-900 mt-0.5">Audience Management</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="btn-secondary" title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              setImportStep(1);
              setImportFile(null);
              setShowImport(true);
            }} 
            className="btn-secondary text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Upload size={13} /> Import CSV / Excel
          </button>
          <button onClick={() => setShowAddContact(true)} className="btn-primary">
            <Plus size={13} /> Add Contact
          </button>
        </div>
      </div>

      <div className="app-card">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={activeTab === t ? 'app-tab-active' : 'app-tab'}>
              {t}
              <span className="ml-1 text-[10px] text-gray-400">
                ({t === 'Subscribers' ? subscribers.length : t === 'Lists' ? contactLists.length : suppressed.length})
              </span>
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-2 py-1.5 pr-2">
            <div className="flex items-center gap-1.5 border border-gray-200 rounded px-2 py-1">
              <Search size={12} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="outline-none text-xs w-36" />
            </div>
          </div>
        </div>

        {/* Subscribers Tab */}
        {activeTab === 'Subscribers' && (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="w-8 px-4 py-2"><input type="checkbox" className="w-3 h-3" /></th>
                {['Email', 'Name', 'Company', 'Status', 'List', 'Source', 'Added', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Zoho-standard elegant skeleton pulse loader
                Array.from({ length: 7 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-3"><div className="w-3.5 h-3.5 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-3.5 bg-blue-100 rounded w-44"></div></td>
                    <td className="px-3 py-3"><div className="h-3 bg-gray-200 rounded w-28"></div></td>
                    <td className="px-3 py-3"><div className="h-3 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-emerald-100 rounded-full w-14"></div></td>
                    <td className="px-3 py-3"><div className="h-3.5 bg-gray-100 rounded w-20"></div></td>
                    <td className="px-3 py-3"><div className="h-3 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-3 py-3"><div className="h-3 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-3 py-3"><div className="w-4 h-4 bg-gray-200 rounded"></div></td>
                  </tr>
                ))
              ) : (
                paginatedSubscribers.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                    <td className="px-4 py-2.5"><input type="checkbox" className="w-3 h-3" /></td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium text-blue-600">{c.email}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-700">{c.firstName} {c.lastName}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">{c.company}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] text-gray-700 font-medium">{c.list}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{c.source}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400">{c.createdAt}</td>
                    <td className="px-3 py-2.5">
                      <button 
                        onClick={(e) => handleDeleteContact(c.id, e)}
                        title="Delete contact"
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                        <Users size={18} className="text-gray-400" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">No contacts found</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Add contacts or import from CSV to begin.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Lists Tab */}
        {activeTab === 'Lists' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contactLists.map(l => (
              <div key={l.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-600 transition-colors bg-white relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Users size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{l.name}</div>
                      <div className="text-[11px] text-gray-400">{(l.count || 0).toLocaleString()} contacts</div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteList(l.id, e)}
                    title="Delete list"
                    className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">{l.description}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400">Created {l.created}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenListContacts(l)}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      title="View contacts inside this list"
                    >
                      <Eye size={12} /> View Contacts
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      onClick={() => {
                        setImportTargetListId(l.id);
                        setImportStep(1);
                        setShowImport(true);
                      }}
                      className="text-[11px] text-gray-600 hover:text-blue-600 hover:underline font-medium"
                    >
                      + Import
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div
              onClick={() => setShowCreateList(true)}
              className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50/20 group min-h-[100px]"
            >
              <div className="text-center">
                <Plus size={20} className="text-gray-300 group-hover:text-blue-600 mx-auto mb-1" />
                <div className="text-xs font-medium text-gray-500 group-hover:text-blue-600">Create New List</div>
              </div>
            </div>
          </div>
        )}

        {/* Suppression Tab */}
        {activeTab === 'Suppression List' && (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Email', 'Reason', 'Type', 'Date Added'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedSuppressed.map((s, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-xs font-mono text-red-600">{s.email}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{s.reason}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={s.type === 'Bounce' ? 'Bounced' : s.type === 'Complaint' ? 'Complained' : 'Unsubscribed'} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{s.date}</td>
                </tr>
              ))}
              {suppressed.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-gray-400">
                    No suppressed contacts found. Your sender reputation is pristine.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination footer */}
        {activeTab === 'Subscribers' && (
          <Pagination
            currentPage={subscribersPage}
            totalPages={totalSubscribersPages}
            totalItems={filtered.length}
            pageSize={subscribersPageSize}
            onPageChange={setSubscribersPage}
            onPageSizeChange={size => {
              setSubscribersPageSize(size);
              setSubscribersPage(1);
            }}
            pageSizeOptions={[25, 50, 100, 200]}
            itemName="subscribers"
          />
        )}

        {activeTab === 'Suppression List' && (
          <Pagination
            currentPage={suppressedPage}
            totalPages={totalSuppressedPages}
            totalItems={filteredSuppressed.length}
            pageSize={suppressedPageSize}
            onPageChange={setSuppressedPage}
            onPageSizeChange={size => {
              setSuppressedPageSize(size);
              setSuppressedPage(1);
            }}
            pageSizeOptions={[25, 50, 100]}
            itemName="suppressed contacts"
          />
        )}

        {activeTab === 'Lists' && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-white">
            <span className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{contactLists.length}</span> list{contactLists.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {/* View List Contacts Modal */}
      {viewingList && (
        <Modal 
          title={`Contacts in "${viewingList.name}"`} 
          onClose={() => {
            setViewingList(null);
            setListContactSearch('');
          }} 
          size="lg"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-lg p-3">
              <div>
                <h3 className="text-xs font-semibold text-gray-900">{viewingList.name}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{viewingList.description || 'Target audience segment'}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {listContactsData.length.toLocaleString()} Contact{listContactsData.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Search Bar for List Contacts */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search contacts in this list by email, name, or company..."
                value={listContactSearch}
                onChange={(e) => {
                  setListContactSearch(e.target.value);
                  setListModalPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {listContactSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setListContactSearch('');
                    setListModalPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600">Email</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600">Name</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600">Company</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-gray-600">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listContactsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={14} className="animate-spin text-blue-600" />
                          <span>Loading list contacts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredListContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                        {listContactSearch ? `No contacts found matching "${listContactSearch}".` : 'No contacts found inside this list.'}
                      </td>
                    </tr>
                  ) : (
                    filteredListContacts
                      .slice((listModalPage - 1) * listModalPageSize, listModalPage * listModalPageSize)
                      .map(c => {
                        const name = [c.first_name || c.firstName, c.last_name || c.lastName].filter(Boolean).join(' ') || '-';
                        const created = c.created_at ? new Date(c.created_at).toLocaleDateString() : c.createdAt || '-';
                        const statusVal = c.status || 'Active';
                        const formattedStatus = statusVal.charAt(0).toUpperCase() + statusVal.slice(1).toLowerCase();

                        return (
                          <tr key={c.id} className="hover:bg-gray-50/70 text-xs">
                            <td className="px-3 py-2 font-medium text-blue-600">{c.email}</td>
                            <td className="px-3 py-2 text-gray-700">{name}</td>
                            <td className="px-3 py-2 text-gray-600">{c.company || '-'}</td>
                            <td className="px-3 py-2">
                              <StatusBadge status={formattedStatus} />
                            </td>
                            <td className="px-3 py-2 text-gray-400 text-[11px]">{created}</td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            {filteredListContacts.length > 0 && (
              <Pagination
                currentPage={listModalPage}
                totalPages={Math.ceil(filteredListContacts.length / listModalPageSize) || 1}
                totalItems={filteredListContacts.length}
                pageSize={listModalPageSize}
                onPageChange={setListModalPage}
                onPageSizeChange={size => {
                  setListModalPageSize(size);
                  setListModalPage(1);
                }}
                pageSizeOptions={[25, 50, 100, 250]}
                itemName="contacts"
              />
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  const targetId = viewingList.id;
                  setViewingList(null);
                  setListContactSearch('');
                  setImportTargetListId(targetId);
                  setImportStep(1);
                  setShowImport(true);
                }}
                className="btn-secondary text-xs text-blue-600"
              >
                + Import More Contacts
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewingList(null);
                  setListContactSearch('');
                }}
                className="btn-primary text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <Modal title="Add New Contact" onClose={() => setShowAddContact(false)} size="md">
          <form onSubmit={handleCreateContact} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-blue-600"
                placeholder="subscriber@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={e => setNewFirstName(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-blue-600"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={e => setNewLastName(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-blue-600"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={newCompany}
                onChange={e => setNewCompany(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-blue-600"
                placeholder="Tech Solutions Inc."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assign to List</label>
              <select
                value={selectedListId}
                onChange={e => setSelectedListId(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-blue-600 bg-white"
              >
                <option value="">No list (General)</option>
                {contactLists.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddContact(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save to Database</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create List Modal */}
      {showCreateList && (
        <Modal title="Create New Subscriber List" onClose={() => setShowCreateList(false)} size="md">
          <form onSubmit={handleCreateList} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">List Name *</label>
              <input
                type="text"
                required
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-blue-600"
                placeholder="e.g. VIP Customers, Enterprise Leads"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={newListDescription}
                onChange={e => setNewListDescription(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-blue-600 resize-none"
                placeholder="Describe who belongs in this list..."
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowCreateList(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create List</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Meaningful CSV / Excel Import Modal */}
      {showImport && (
        <Modal 
          title="Import Audience — Meaningful CSV & Excel Mapper" 
          onClose={() => { setShowImport(false); setImportStep(1); }} 
          size="lg"
        >
          <div className="p-5 space-y-5">
            {/* Step 1: List selection & File upload */}
            {importStep === 1 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2">
                  <FileSpreadsheet size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Step 1: Choose target list and upload your file.</span>
                    <p className="text-blue-700 mt-0.5">Contacts will be added to your LeadA360 audience and assigned to your chosen segment.</p>
                  </div>
                </div>

                {/* Target List Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Select Target Subscriber List <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={importTargetListId}
                    onChange={e => setImportTargetListId(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="">General Contacts (No specific list)</option>
                    {contactLists.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.count || 0} existing contacts)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropzone */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv,.txt"
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileProcess(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-gray-700">Click to upload or drag & drop CSV file</div>
                  <div className="text-xs text-gray-400 mt-1">Supports CSV and tab-delimited files up to 50MB</div>
                  <div className="inline-flex items-center gap-1 text-[11px] text-blue-600 mt-3 font-medium bg-blue-50 px-2 py-1 rounded">
                    Supported columns: Email, First Name, Last Name, Company, Phone
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      const sample = 'email,first_name,last_name,company\njohn@example.com,John,Doe,Acme Corp\njane@example.com,Jane,Smith,Global Tech';
                      const blob = new Blob([sample], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'sample_contacts_template.csv';
                      a.click();
                    }}
                    className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Download size={12} /> Download Sample CSV Template
                  </button>
                  <button onClick={() => setShowImport(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            )}

            {/* Step 2: Meaningful Field Mapping & Preview */}
            {importStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">Map Columns to LeadA360 Fields</h3>
                    <p className="text-[11px] text-gray-400">
                      File: <span className="font-mono text-gray-700">{importFile?.name}</span> ({parsedRows.length} rows detected)
                    </p>
                  </div>
                  <button 
                    onClick={() => setImportStep(1)} 
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Change File
                  </button>
                </div>

                {/* Target List Banner */}
                <div className="text-xs bg-gray-50 p-2.5 rounded border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-gray-500">Destination List: </span>
                    <span className="font-semibold text-gray-800">
                      {contactLists.find(l => l.id === importTargetListId)?.name || 'General Master Directory'}
                    </span>
                  </div>
                  <span className="text-[11px] text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    Ready to map
                  </span>
                </div>

                {/* Field Mapping Grid */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={fieldMappings.email}
                      onChange={e => setFieldMappings({ ...fieldMappings, email: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="">-- Select matching column --</option>
                      {csvHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">First Name</label>
                    <select
                      value={fieldMappings.first_name}
                      onChange={e => setFieldMappings({ ...fieldMappings, first_name: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="">-- Ignore this field --</option>
                      {csvHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Last Name</label>
                    <select
                      value={fieldMappings.last_name}
                      onChange={e => setFieldMappings({ ...fieldMappings, last_name: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="">-- Ignore this field --</option>
                      {csvHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Company / Organization</label>
                    <select
                      value={fieldMappings.company}
                      onChange={e => setFieldMappings({ ...fieldMappings, company: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="">-- Ignore this field --</option>
                      {csvHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Preview of first 3 rows */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-600 mb-1.5">First 3 Rows Preview:</div>
                  <div className="border border-gray-200 rounded overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr>
                          <th className="p-2 text-[10px]">Email</th>
                          <th className="p-2 text-[10px]">First Name</th>
                          <th className="p-2 text-[10px]">Last Name</th>
                          <th className="p-2 text-[10px]">Company</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 3).map((r, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="p-2 font-mono text-blue-600 text-[11px]">{fieldMappings.email ? r[fieldMappings.email] : '—'}</td>
                            <td className="p-2 text-gray-700 text-[11px]">{fieldMappings.first_name ? r[fieldMappings.first_name] : '—'}</td>
                            <td className="p-2 text-gray-700 text-[11px]">{fieldMappings.last_name ? r[fieldMappings.last_name] : '—'}</td>
                            <td className="p-2 text-gray-600 text-[11px]">{fieldMappings.company ? r[fieldMappings.company] : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Import Buttons */}
                <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setImportStep(1)} 
                    className="btn-secondary"
                    disabled={isImporting}
                  >
                    Back
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCompleteImport} 
                    disabled={isImporting || !fieldMappings.email}
                    className="btn-primary flex items-center gap-1.5"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Importing Contacts...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} /> Confirm & Import {parsedRows.length} Contacts
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}