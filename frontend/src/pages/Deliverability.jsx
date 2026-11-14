import { CheckCircle, AlertCircle, TrendingUp, Shield, Server, ExternalLink } from 'lucide-react';

const warmupWeeks = [
  { week: 'Week 1', range: '5K–10K emails/day', status: 'done', cap: 10000, actual: 9800 },
  { week: 'Week 2', range: '15K–25K emails/day', status: 'current', cap: 25000, actual: 24500 },
  { week: 'Week 3', range: '30K–40K emails/day', status: 'upcoming', cap: 40000, actual: 0 },
  { week: 'Week 4', range: 'Full 50K emails/day', status: 'upcoming', cap: 50000, actual: 0 },
];

const dnsRecords = [
  { type: 'SPF', record: 'v=spf1 include:amazonses.com ~all', status: 'VERIFIED', detail: 'Allows AWS SES to send on behalf of verified domains' },
  { type: 'DKIM', record: '3× CNAME (2048-bit RSA key rotation)', status: 'VERIFIED', detail: 'DomainKeys Identified Mail signature verified' },
  { type: 'DMARC', record: 'v=DMARC1; p=quarantine; pct=100', status: 'VERIFIED', detail: 'Domain-based Message Authentication & Reporting active' },
  { type: 'MAIL FROM', record: 'mail.leada360.com (Custom Bounce Domain)', status: 'ACTIVE', detail: 'Custom MAIL FROM domain protecting main domain reputation' },
];

export default function Deliverability() {
  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div>
        <div className="text-xs text-gray-500">Deliverability</div>
        <h1 className="text-base font-semibold text-gray-900 mt-0.5">Amazon SES Health Center</h1>
      </div>

      {/* SES Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Sending Quota', value: '14 emails/sec', sub: 'AWS SES Production Rate', icon: Server, color: 'blue' },
          { label: 'Google Spam Rate', value: '0.03%', sub: 'Threshold: < 0.10%', icon: Shield, color: 'green' },
          { label: 'Daily Sending Cap', value: '50,000', sub: 'Production Quota: 50K/day', icon: TrendingUp, color: 'yellow' },
          { label: 'Bounce Rate (SES)', value: '0.38%', sub: 'SES limit: < 5%', icon: AlertCircle, color: 'green' },
        ].map(s => {
          const colorMap = { blue: 'text-blue-600 bg-blue-50', green: 'text-green-600 bg-green-50', yellow: 'text-yellow-600 bg-yellow-50' };
          const Icon = s.icon;
          return (
            <div key={s.label} className="app-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className="text-lg font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[s.color]}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DNS Authentication */}
      <div className="app-card">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-800">Domain Authentication</div>
          <div className="text-[11px] text-gray-500 mt-0.5">All DNS records verified and active on Route 53</div>
        </div>
        <div className="p-4 space-y-3">
          {dnsRecords.map(r => (
            <div key={r.type} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
              <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-gray-900">{r.type}</span>
                  <span className="bg-green-100 text-green-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">{r.status}</span>
                </div>
                <div className="text-xs font-mono text-gray-600 break-all">{r.record}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IP Warmup Tracker */}
      <div className="app-card p-4">
        <div className="text-xs font-semibold text-gray-800 mb-1">30-Day IP Warmup Progress Tracker</div>
        <div className="text-[11px] text-gray-500 mb-4">Gradually building sender reputation to reach full 50,000 emails/day throughput</div>
        <div className="space-y-3">
          {warmupWeeks.map((w, i) => (
            <div key={i} className="flex items-center gap-4">
              {/* Status icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                w.status === 'done' ? 'bg-green-100' : w.status === 'current' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {w.status === 'done' ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : w.status === 'current' ? (
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-semibold text-gray-800">{w.week}</span>
                    <span className="text-[11px] text-gray-500 ml-2">{w.range}</span>
                    {w.status === 'current' && <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">CURRENT</span>}
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {w.actual > 0 ? `${w.actual.toLocaleString()} / ${w.cap.toLocaleString()}` : `0 / ${w.cap.toLocaleString()}`}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${w.status === 'done' ? 'bg-green-500' : w.status === 'current' ? 'bg-blue-500' : 'bg-gray-300'}`}
                    style={{ width: `${w.actual > 0 ? Math.min((w.actual / w.cap) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Postmaster */}
      <div className="app-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-800">Domain Reputation Monitor</div>
          <a href="#" className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
            <ExternalLink size={11} /> Open Diagnostics
          </a>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Domain Reputation', value: 'HIGH', color: 'green' },
            { label: 'IP Reputation', value: 'HIGH', color: 'green' },
            { label: 'Spam Rate (7-day avg)', value: '0.03%', color: 'green' },
          ].map(m => (
            <div key={m.label} className={`rounded-lg p-3 ${m.color === 'green' ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'}`}>
              <div className="text-[11px] text-gray-500 mb-1">{m.label}</div>
              <div className={`text-sm font-bold ${m.color === 'green' ? 'text-green-700' : 'text-yellow-700'}`}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
