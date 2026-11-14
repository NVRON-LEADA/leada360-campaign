import { Zap, GitBranch, Clock, Mail, Users, ArrowRight, CheckCircle, XCircle, Plus } from 'lucide-react';

const workflow = [
  { id: 1, type: 'trigger', label: 'Trigger: Contact Joins List', sub: '"New Website Signups"', color: '#7C3AED', icon: Users },
  { id: 2, type: 'action', label: 'Send Email', sub: 'Welcome & Getting Started Guide', color: '#1366D9', icon: Mail },
  { id: 3, type: 'delay', label: 'Wait 2 Days', sub: 'Time delay node', color: '#F59E0B', icon: Clock },
  { id: 4, type: 'condition', label: 'Condition: Opened Welcome Email?', sub: 'Checks for open event in last 48h', color: '#0F9D58', icon: GitBranch },
];

export default function Automation() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Automation</div>
          <h1 className="text-base font-semibold text-gray-900 mt-0.5">Customer Journey Builder</h1>
        </div>
        <button className="btn-primary"><Plus size={13} /> Create Workflow</button>
      </div>

      {/* Workflow Canvas */}
      <div className="app-card p-6">
        <div className="text-xs font-semibold text-gray-700 mb-6">Journey: Welcome Drip Series (Active)</div>

        <div className="flex flex-col items-center gap-0">
          {workflow.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.id} className="flex flex-col items-center">
                {/* Node */}
                <div className="w-72 border-2 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderColor: node.color + '40', background: node.color + '08' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: node.color + '20' }}>
                      <Icon size={15} style={{ color: node.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">{node.label}</div>
                      <div className="text-[11px] text-gray-500">{node.sub}</div>
                    </div>
                  </div>
                </div>

                {/* Connector / Branch */}
                {i < workflow.length - 1 && (
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-5 bg-gray-300" />
                    <ArrowRight size={12} className="text-gray-400 rotate-90" />
                  </div>
                )}

                {/* Branch nodes after condition */}
                {node.type === 'condition' && (
                  <div className="flex gap-10 mt-2">
                    {[
                      { label: 'YES — Opened', sub: 'Send: Product Demo Invitation', icon: CheckCircle, color: '#0F9D58' },
                      { label: 'NO — Not Opened', sub: 'Send: Gentle Reminder', icon: XCircle, color: '#E42528' },
                    ].map(branch => {
                      const BIcon = branch.icon;
                      return (
                        <div key={branch.label} className="flex flex-col items-center">
                          <div className="w-0.5 h-4 bg-gray-300" />
                          <div className="w-56 border-2 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
                            style={{ borderColor: branch.color + '40', background: branch.color + '08' }}>
                            <div className="flex items-center gap-2">
                              <BIcon size={14} style={{ color: branch.color }} />
                              <div>
                                <div className="text-[11px] font-semibold text-gray-800">{branch.label}</div>
                                <div className="text-[10px] text-gray-500">{branch.sub}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pre-built templates */}
      <div>
        <div className="text-xs font-semibold text-gray-700 mb-3">Pre-built Automation Templates</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: 'Welcome Series', desc: '3-email onboarding sequence for new subscribers', emoji: '👋' },
            { name: 'Inactive Re-Engagement', desc: 'Win back contacts inactive for 90+ days', emoji: '💌' },
            { name: 'Event Countdown', desc: 'Pre-event reminders at 7d, 3d, and 1d', emoji: '⏰' },
          ].map(t => (
            <div key={t.name} className="app-card p-3 flex items-start gap-3 cursor-pointer hover:border-blue-600 transition-colors">
              <span className="text-2xl">{t.emoji}</span>
              <div>
                <div className="text-xs font-semibold text-gray-900">{t.name}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{t.desc}</div>
                <button className="text-[11px] text-blue-600 mt-1.5 hover:underline">Use Template →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
