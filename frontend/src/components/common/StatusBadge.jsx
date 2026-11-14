const statusMap = {
  Sent: 'status-sent',
  Scheduled: 'status-scheduled',
  Draft: 'status-draft',
  Processing: 'status-processing',
  Active: 'status-active',
  Bounced: 'status-bounced',
  Unsubscribed: 'status-unsubscribed',
  Complained: 'bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium',
  Clicked: 'bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium',
  Opened: 'bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium',
  Delivered: 'bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium',
};

const dots = {
  Sent: 'bg-green-500', Scheduled: 'bg-yellow-500', Draft: 'bg-gray-400',
  Processing: 'bg-blue-500', Active: 'bg-green-500', Bounced: 'bg-red-500',
  Unsubscribed: 'bg-orange-500', Complained: 'bg-red-600',
};

export default function StatusBadge({ status, dot = true }) {
  return (
    <span className={statusMap[status] || 'bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium'}>
      {dot && dots[status] && <span className={`inline-block w-1.5 h-1.5 rounded-full ${dots[status]} mr-1 mb-0.5`}></span>}
      {status}
    </span>
  );
}

