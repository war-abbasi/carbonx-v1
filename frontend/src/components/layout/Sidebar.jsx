import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Activity, BarChart3, MessageSquare,
  Sparkles, ShieldCheck, Settings, LogOut,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn }    from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useApp }  from '../../context/AppContext';
import { useAuthStore } from '../../store/authStore';
import iconImg from '../../assets/carbonx-icon.png';

const ALL_NAV = [
  { icon: LayoutDashboard, label: 'Overview',    href: '/dashboard',            exact: true, adminOnly: false },
  { icon: Activity,        label: 'Activities',  href: '/dashboard/activities',              adminOnly: false },
  { icon: BarChart3,       label: 'Analytics',   href: '/dashboard/analytics',               adminOnly: false },
  { icon: MessageSquare,   label: 'AI Chat',     href: '/dashboard/chat',                    adminOnly: false },
  { icon: Sparkles,        label: 'AI Insights', href: '/dashboard/insights',                adminOnly: false },
  { icon: ShieldCheck,     label: 'Admin Panel', href: '/dashboard/admin',                   adminOnly: true  },
];

const BOTTOM = [
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const { handleLogout }               = useAuth();
  const { sidebarOpen, toggleSidebar } = useApp();
  const navigate                       = useNavigate();
  const { user }                       = useAuthStore();
  const isAdmin                        = user?.role === 'ADMIN';
  const NAV                            = ALL_NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen flex-shrink-0 transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
      style={{ background: '#ffffff', borderRight: '1px solid #E5EAE8' }}
    >
      {/* ── Logo ── */}
      <div
        className={cn('flex items-center h-16 px-4 flex-shrink-0', sidebarOpen ? 'gap-3' : 'justify-center')}
        style={{ borderBottom: '1px solid #E5EAE8' }}
      >
        {sidebarOpen ? (
          <>
            <img src={iconImg} alt="CarbonX" className="h-7 w-7 object-contain flex-shrink-0" />
            <span className="font-bold text-base tracking-tight" style={{ color: '#1B4332' }}>CarbonX</span>
          </>
        ) : (
          <img src={iconImg} alt="CarbonX" className="h-7 w-7 object-contain" />
        )}
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[72px] z-10 h-6 w-6 rounded-full flex items-center justify-center shadow-sm transition-colors hover:opacity-80"
        style={{ background: '#ffffff', border: '1px solid #E5EAE8', color: '#6B8F7A' }}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen
          ? <ChevronLeft className="h-3.5 w-3.5" />
          : <ChevronRight className="h-3.5 w-3.5" />
        }
      </button>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
        {sidebarOpen && (
          <p className="px-3 mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em]" style={{ color: '#9BAEA5' }}>
            Navigation
          </p>
        )}
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              title={!sidebarOpen ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  !sidebarOpen && 'justify-center px-2',
                  isActive
                    ? 'text-[#1B4332] bg-[#EAF4EE]'
                    : 'text-[#5A7A6D] hover:text-[#1B4332] hover:bg-[#F4FAF6]'
                )
              }
              style={({ isActive }) =>
                isActive ? { borderLeft: '3px solid #2D6A4F', paddingLeft: sidebarOpen ? '9px' : '5px' } : { borderLeft: '3px solid transparent' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="flex-shrink-0"
                    style={{ width: '17px', height: '17px', color: isActive ? '#2D6A4F' : '#7A9E8E' }}
                  />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-2 pb-4 space-y-0.5" style={{ borderTop: '1px solid #E5EAE8', paddingTop: '12px' }}>
        {BOTTOM.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                'text-[#5A7A6D] hover:text-[#1B4332] hover:bg-[#F4FAF6]',
                !sidebarOpen && 'justify-center px-2'
              )}
              style={{ borderLeft: '3px solid transparent' }}
            >
              <Icon style={{ width: '17px', height: '17px', color: '#7A9E8E', flexShrink: 0 }} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        <button
          onClick={handleLogout}
          title={!sidebarOpen ? 'Sign Out' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            'hover:bg-red-50',
            !sidebarOpen && 'justify-center px-2'
          )}
          style={{ color: '#DC2626', borderLeft: '3px solid transparent' }}
        >
          <LogOut style={{ width: '17px', height: '17px', flexShrink: 0 }} />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
