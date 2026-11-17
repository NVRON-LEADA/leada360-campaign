import { generateEmailHtml } from '../mockData/templates';
import { Eye, Plus, Send, Check, X, Edit, Palette, Trash2, Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

const CATS = ['All', 'Product Launch', 'Newsletter', 'Promotional', 'Event', 'Transactional', 'Custom'];

export default function Templates({ onSelectTemplate, onCreateWithTemplate }) {
  const [templateList, setTemplateList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Edit form states
  const [editForm, setEditForm] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await api.templates.list();
      const list = Array.isArray(data) ? data : (data?.results || []);
      // Map API schema to component fields if needed
      const mapped = list.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        thumbnail: item.thumbnail || '📧',
        description: item.description || '',
        previewColor: item.preview_color || item.theme?.headerBg || '#1e3a8a',
        is_system: item.is_system,
        theme: item.theme || {
          headerBg: '#1e3a8a',
          headerTextColor: '#ffffff',
          accentColor: '#2563eb',
          buttonBg: '#2563eb',
          buttonTextColor: '#ffffff',
          bodyBg: '#ffffff',
          footerBg: '#f8fafc',
          footerTextColor: '#64748b',
        },
        defaultContent: item.default_content || {
          headingText: '',
          subheadingText: '',
          greetingText: 'Dear {{first_name}},',
          messageParagraph1: '',
          messageParagraph2: '',
          ctaButtonText: 'Learn More',
          ctaButtonUrl: 'https://nvron.in',
          companyName: 'NVRON Life Science',
          companyAddress: 'Bangalore, India',
          footerLinks: [],
        }
      }));
      setTemplateList(mapped);
    } catch (err) {
      console.error('Failed to load templates from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filtered = cat === 'All' ? templateList : templateList.filter(t => t.category?.toLowerCase() === cat.toLowerCase());

  const handleUseTemplate = (template) => {
    if (onCreateWithTemplate) {
      onCreateWithTemplate(template);
    } else if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const handleOpenEdit = (t) => {
    setEditingTemplate(t);
    setEditForm({
      name: t.name,
      category: t.category,
      description: t.description || '',
      headerBg: t.theme?.headerBg || '#1e3a8a',
      buttonBg: t.theme?.buttonBg || '#2563eb',
      footerBg: t.theme?.footerBg || '#f8fafc',
      headingText: t.defaultContent?.headingText || '',
      subheadingText: t.defaultContent?.subheadingText || '',
      greetingText: t.defaultContent?.greetingText || '',
      messageParagraph1: t.defaultContent?.messageParagraph1 || '',
      messageParagraph2: t.defaultContent?.messageParagraph2 || '',
      ctaButtonText: t.defaultContent?.ctaButtonText || '',
      ctaButtonUrl: t.defaultContent?.ctaButtonUrl || '',
      companyName: t.defaultContent?.companyName || '',
      companyAddress: t.defaultContent?.companyAddress || '',
      footerLinks: t.defaultContent?.footerLinks ? [...t.defaultContent.footerLinks] : [],
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTemplate || !editForm) return;

    setIsSaving(true);
    const updatedTheme = {
      ...editingTemplate.theme,
      headerBg: editForm.headerBg,
      buttonBg: editForm.buttonBg,
      footerBg: editForm.footerBg,
      accentColor: editForm.buttonBg,
    };

    const updatedDefaultContent = {
      ...editingTemplate.defaultContent,
      headingText: editForm.headingText,
      subheadingText: editForm.subheadingText,
      greetingText: editForm.greetingText,
      messageParagraph1: editForm.messageParagraph1,
      messageParagraph2: editForm.messageParagraph2,
      ctaButtonText: editForm.ctaButtonText,
      ctaButtonUrl: editForm.ctaButtonUrl,
      companyName: editForm.companyName,
      companyAddress: editForm.companyAddress,
      footerLinks: editForm.footerLinks,
    };

    const payload = {
      name: editForm.name,
      category: editForm.category,
      description: editForm.description,
      preview_color: editForm.headerBg,
      theme: updatedTheme,
      default_content: updatedDefaultContent,
    };

    try {
      await api.templates.update(editingTemplate.id, payload);
      setTemplateList(prev => prev.map(item => item.id === editingTemplate.id ? {
        ...item,
        ...payload,
        previewColor: editForm.headerBg,
        defaultContent: updatedDefaultContent,
      } : item));
      setEditingTemplate(null);
      setEditForm(null);
    } catch (err) {
      console.error('Failed to update template:', err);
      alert('Failed to save template changes to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId, e) => {
    e?.stopPropagation();
    try {
      await api.templates.delete(templateId);
      setTemplateList(prev => prev.filter(t => t.id !== templateId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete template:', err);
      alert('Failed to delete template from database.');
    }
  };

  const handleCreateNewTemplate = async () => {
    const newTemplatePayload = {
      name: 'Custom New Template',
      category: 'Custom',
      thumbnail: '✨',
      description: 'Clean branded layout ready for customized messaging',
      preview_color: '#2563eb',
      theme: {
        headerBg: '#1e3a8a',
        headerTextColor: '#ffffff',
        accentColor: '#2563eb',
        buttonBg: '#2563eb',
        buttonTextColor: '#ffffff',
        bodyBg: '#ffffff',
        footerBg: '#f8fafc',
        footerTextColor: '#64748b',
      },
      default_content: {
        headingText: 'Your Announcement Title',
        subheadingText: 'Subheading or tagline here',
        greetingText: 'Dear {{first_name}},',
        messageParagraph1: 'Write your primary marketing message or announcement here.',
        messageParagraph2: 'Add any supporting points, instructions, or notes here.',
        ctaButtonText: 'Take Action Now',
        ctaButtonUrl: 'https://nvron.in',
        companyName: 'NVRON Life Science',
        companyAddress: 'Bangalore, India',
        footerLinks: [],
      }
    };

    try {
      const created = await api.templates.create(newTemplatePayload);
      const mapped = {
        id: created.id,
        name: created.name,
        category: created.category,
        thumbnail: created.thumbnail || '✨',
        description: created.description,
        previewColor: created.preview_color || '#2563eb',
        theme: created.theme,
        defaultContent: created.default_content,
      };
      setTemplateList(prev => [mapped, ...prev]);
      handleOpenEdit(mapped);
    } catch (err) {
      console.error('Failed to create new template:', err);
      alert('Could not create new template.');
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Design & Layouts</div>
          <h1 className="text-base font-semibold text-gray-900 mt-0.5">Email Template Library</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNewTemplate}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus size={13} /> Create Template
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${cat === c ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-600 hover:text-blue-600'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Templates Grid with Zoho-standard Pulse Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`template-skeleton-${idx}`} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs animate-pulse">
              <div className="h-44 bg-gray-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-full"></div>
                <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                <div className="pt-3 flex gap-2">
                  <div className="h-7 bg-blue-100 rounded flex-1"></div>
                  <div className="h-7 w-7 bg-gray-100 rounded"></div>
                  <div className="h-7 w-7 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all bg-white group flex flex-col justify-between relative">
              {/* Card Header & Preview Banner */}
              <div>
                <div 
                  className="h-44 relative flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-transform group-hover:scale-[1.01]"
                  style={{ backgroundColor: t.theme?.headerBg || t.previewColor }}
                  onClick={() => setPreviewTemplate(t)}
                >
                  <div className="text-3xl mb-1.5 drop-shadow-sm">{t.thumbnail}</div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/90 bg-black/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    {t.category}
                  </span>
                  
                  {/* Hover Quick Preview Button */}
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); }}
                      className="px-2.5 py-1.5 bg-white text-gray-900 rounded text-[11px] font-semibold shadow-md flex items-center gap-1 hover:bg-gray-100"
                    >
                      <Eye size={12} /> Preview
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }}
                      className="px-2.5 py-1.5 bg-blue-600 text-white rounded text-[11px] font-semibold shadow-md flex items-center gap-1 hover:bg-blue-700"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4">
                  <div className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                    {t.description || 'Custom corporate email layout'}
                  </div>
                  
                  {/* Color Scheme Indicator */}
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-100 text-[10px] text-gray-400">
                    <span>Theme:</span>
                    <span className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: t.theme?.headerBg }} title="Header" />
                    <span className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: t.theme?.buttonBg }} title="Button" />
                    <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-xs" style={{ backgroundColor: t.theme?.footerBg }} title="Footer" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0">
                <div className="mt-1 pt-2 flex items-center gap-1.5 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(t)}
                    className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs"
                  >
                    <Send size={11} /> Use in Campaign
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-600 rounded"
                    title="Edit Template"
                  >
                    <Edit size={13} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPreviewTemplate(t)}
                    className="p-1.5 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-600 rounded"
                    title="Full Preview"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(t.id)}
                    className="p-1.5 border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded"
                    title="Delete Template"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* In-Card Delete Confirmation Overlay */}
              {deleteConfirmId === t.id && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-30 p-4 flex flex-col items-center justify-center text-center animate-fadeIn">
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
                    <Trash2 size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Delete this template?</h4>
                  <p className="text-[10px] text-gray-500 mt-1 max-w-[180px]">This will permanently remove "{t.name}" from the database.</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 rounded border border-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => handleDeleteTemplate(t.id, e)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded shadow-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Blank/Custom Option */}
          <div 
            onClick={handleCreateNewTemplate}
            className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center min-h-[300px] cursor-pointer hover:border-blue-600 hover:bg-blue-50/20 group transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-2 transition-colors">
              <Plus size={20} className="text-gray-400 group-hover:text-blue-600" />
            </div>
            <div className="text-xs font-semibold text-gray-700 group-hover:text-blue-600">Start Blank Canvas</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Custom layout saved directly in DB</div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setEditingTemplate(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Edit size={16} className="text-blue-600" />
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Edit Template: {editingTemplate.name}</h3>
                  <p className="text-[10px] text-gray-500">Edit title, category, colors, and body content saved in database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 hover:bg-gray-200 rounded text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Basic Template Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Template Title / Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:border-blue-500 focus:outline-hidden"
                  >
                    {CATS.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Description / Card Subtitle</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:border-blue-500 focus:outline-hidden"
                  placeholder="Short summary of this email layout"
                />
              </div>

              {/* Color Styling */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                <div className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                  <Palette size={13} className="text-blue-600" />
                  Color Palette (Header, CTA, Footer)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Header Background</label>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={editForm.headerBg} onChange={e => setEditForm({ ...editForm, headerBg: e.target.value })} className="w-7 h-7 rounded border cursor-pointer p-0.5" />
                      <input type="text" value={editForm.headerBg} onChange={e => setEditForm({ ...editForm, headerBg: e.target.value })} className="w-full text-[11px] border rounded px-1.5 py-1 font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">CTA Button Color</label>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={editForm.buttonBg} onChange={e => setEditForm({ ...editForm, buttonBg: e.target.value })} className="w-7 h-7 rounded border cursor-pointer p-0.5" />
                      <input type="text" value={editForm.buttonBg} onChange={e => setEditForm({ ...editForm, buttonBg: e.target.value })} className="w-full text-[11px] border rounded px-1.5 py-1 font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Footer Background</label>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={editForm.footerBg} onChange={e => setEditForm({ ...editForm, footerBg: e.target.value })} className="w-7 h-7 rounded border cursor-pointer p-0.5" />
                      <input type="text" value={editForm.footerBg} onChange={e => setEditForm({ ...editForm, footerBg: e.target.value })} className="w-full text-[11px] border rounded px-1.5 py-1 font-mono" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Title & Subtitle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Header Heading Text</label>
                  <input
                    type="text"
                    value={editForm.headingText}
                    onChange={e => setEditForm({ ...editForm, headingText: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Sub-heading Text</label>
                  <input
                    type="text"
                    value={editForm.subheadingText}
                    onChange={e => setEditForm({ ...editForm, subheadingText: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* Greeting & Body Paragraphs */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Greeting Template</label>
                <input
                  type="text"
                  value={editForm.greetingText}
                  onChange={e => setEditForm({ ...editForm, greetingText: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Primary Body Paragraph</label>
                <textarea
                  rows={3}
                  value={editForm.messageParagraph1}
                  onChange={e => setEditForm({ ...editForm, messageParagraph1: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded p-2.5 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Secondary Paragraph</label>
                <textarea
                  rows={2}
                  value={editForm.messageParagraph2}
                  onChange={e => setEditForm({ ...editForm, messageParagraph2: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded p-2.5 resize-none leading-relaxed"
                />
              </div>

              {/* Button */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={editForm.ctaButtonText}
                    onChange={e => setEditForm({ ...editForm, ctaButtonText: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Button Link URL</label>
                  <input
                    type="url"
                    value={editForm.ctaButtonUrl}
                    onChange={e => setEditForm({ ...editForm, ctaButtonUrl: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Company Address</label>
                  <input
                    type="text"
                    value={editForm.companyAddress}
                    onChange={e => setEditForm({ ...editForm, companyAddress: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = editingTemplate.id;
                    setEditingTemplate(null);
                    setDeleteConfirmId(idToDelete);
                  }}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded font-medium flex items-center gap-1"
                >
                  <Trash2 size={13} /> Delete Template
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {isSaving ? 'Saving to Database...' : 'Save Template Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Live HTML Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setPreviewTemplate(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">{previewTemplate.thumbnail}</span>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">{previewTemplate.name}</h3>
                  <p className="text-[10px] text-gray-500">{previewTemplate.category} Template Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const selected = previewTemplate;
                    setPreviewTemplate(null);
                    handleOpenEdit(selected);
                  }}
                  className="px-3 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Edit size={12} /> Edit Template
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const selected = previewTemplate;
                    setPreviewTemplate(null);
                    handleUseTemplate(selected);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Check size={13} /> Use This Template
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
              <div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                dangerouslySetInnerHTML={{
                  __html: generateEmailHtml(previewTemplate, {
                    greetingText: 'Dear Dr. Alexander,',
                  })
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
