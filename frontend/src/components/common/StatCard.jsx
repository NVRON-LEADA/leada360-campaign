import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, sub, trend, trendVal, icon: Icon, color = 'blue', highlight }) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className={`app-card p-4 ${highlight ? 'border-l-2 border-l-blue-600' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
          {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      {trendVal !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trendVal} vs last month</span>
        </div>
      )}
    </div>
  );
}
