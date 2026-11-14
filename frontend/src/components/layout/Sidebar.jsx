import {
  Gauge, Megaphone, Users2, Workflow,
  FolderTree, BarChart3, ShieldCheck, UserCog
} from 'lucide-react';

const navItems = [
  { icon: Gauge, label: 'Dashboard', key: 'dashboard' },
  { icon: Megaphone, label: 'Campaigns', key: 'campaigns' },
  { icon: Users2, label: 'Contacts', key: 'contacts' },
  { icon: Workflow, label: 'Automation', key: 'automation' },
  { icon: FolderTree, label: 'Library', key: 'templates' },
  { icon: BarChart3, label: 'Reports', key: 'analytics' },
  { icon: ShieldCheck, label: 'Deliverability', key: 'deliverability' },
  { icon: UserCog, label: 'Team', key: 'users' },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="w-[72px] bg-[#081D34] flex flex-col items-center py-2 min-h-screen flex-shrink-0 z-10 select-none">
      <nav className="w-full flex flex-col gap-1">
        {navItems.map(({ icon: Icon, label, key }) => {
          const isActive = activePage === key;
          return (
            <button
              key={key}
              onClick={() => setActivePage(key)}
              title={label}
              className={`w-full py-2.5 px-1 flex flex-col items-center justify-center transition-all duration-150 relative group ${
                isActive
                  ? 'bg-[#0D2D52] text-white font-medium border-l-[3px] border-l-coral'
                  : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-[3px] border-l-transparent'
              }`}
            >
              <Icon
                size={19}
                className={`transition-transform group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`}
                strokeWidth={1.75}
              />
              <span className="text-[10px] mt-1 leading-tight tracking-tight text-center">
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
