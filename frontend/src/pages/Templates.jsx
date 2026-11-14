import { templates as defaultTemplates, generateEmailHtml } from '../mockData/templates';
import { Eye, Plus, Send, Check, X, Edit, Palette, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const CATS = ['All', 'Product Launch', 'Newsletter', 'Promotional', 'Event', 'Transactional', 'Custom'];

export default function Templates({ onSelectTemplate, onCreateWithTemplate }) {
  const [templateList, setTemplateList] = useState(defaultTemplates);
  const [cat, setCat] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Edit form states
  const [editForm, setEditForm] = useState(null);

  const filtered = cat === 'All' ? templateList : templateList.filter(t => t.category === cat);

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
      description: t.description,
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

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTemplate || !editForm) return;

    const updatedTemplate = {
      ...editingTemplate,
      name: editForm.name,
      category: editForm.category,
      description: editForm.description,
      theme: {
        ...editingTemplate.theme,
        headerBg: editForm.headerBg,
        buttonBg: editForm.buttonBg,
        footerBg: editForm.footerBg,
        accentColor: editForm.buttonBg,
      },
      defaultContent: {
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
      }
    };

    setTemplateList(prev => prev.map(item => item.id === editingTemplate.id ? updatedTemplate : item));
    setEditingTemplate(null);
    setEditForm(null);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Design & Layouts</div>
          <h1 className="text-base font-semibold text-gray-900 mt-0.5">Email Template Library</h1>
        </div>
        <div className="text-xs text-gray-500">
          Preview, customize colors & headers, or connect directly into new campaigns
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

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="app-card overflow-hidden group flex flex-col justify-between border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all">
            {/* Visual Hero Preview */}
            <div 
              className="h-36 flex flex-col items-center justify-center relative p-3 text-white cursor-pointer"
              style={{ backgroundColor: t.theme?.headerBg || t.previewColor }}
              onClick={() => setPreviewTemplate(t)}
            >
              <div className="text-4xl mb-1">{t.thumbnail}</div>
              <div className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-black/25">
                {t.category}
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); }}
                  className="px-2.5 py-1.5 bg-white text-gray-800 rounded text-xs font-semibold flex items-center gap-1 shadow hover:bg-gray-100"
                >
                  <Eye size={12} /> Preview
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }}
                  className="px-2.5 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold flex items-center gap-1 shadow hover:bg-blue-700"
                >
                  <Edit size={12} /> Edit
                </button>
              </div>
            </div>

            {/* Template Information */}
            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {t.name}
                </div>
                <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  {t.description}
                </div>
                
                {/* Color Scheme Indicator */}
                <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-100 text-[10px] text-gray-400">
                  <span>Theme:</span>
                  <span className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: t.theme?.headerBg }} title="Header" />
                  <span className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: t.theme?.buttonBg }} title="Button" />
                  <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-xs" style={{ backgroundColor: t.theme?.footerBg }} title="Footer" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUseTemplate(t)}
                  className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
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
              </div>
            </div>
          </div>
        ))}

        {/* Blank/Custom Option */}
        <div 
          onClick={() => handleUseTemplate(templateList[6] || defaultTemplates[0])}
          className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-64 cursor-pointer hover:border-blue-600 hover:bg-blue-50/20 group transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-2 transition-colors">
            <Plus size={20} className="text-gray-400 group-hover:text-blue-600" />
          </div>
          <div className="text-xs font-semibold text-gray-700 group-hover:text-blue-600">Start Blank Canvas</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Custom layout with clean styles</div>
        </div>
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setEditingTemplate(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Edit size={16} className="text-blue-600" />
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Edit Template: {editingTemplate.name}</h3>
                  <p className="text-[10px] text-gray-500">Configure theme colors, header text, and default body</p>
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
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 bg-white"
                  >
                    {CATS.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
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
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Check size={13} /> Save Template Changes
                </button>
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
