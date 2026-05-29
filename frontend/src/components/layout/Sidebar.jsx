import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Leaf, BarChart3, FileText, Zap,
  Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn }    from '../../lib/utils';
import { Logo }  from '../shared/Logo';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { useApp }  from '../../context/AppContext';
import iconImg from '../../assets/carbonx-icon.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',  href: '/dashboard',           exact: true },
  { icon: Leaf,            label: 'Emissions',  href: '/dashboard/emissions', soon: true  },
  { icon: BarChart3,       label: 'Analytics',  href: '/dashboard/analytics', soon: true  },
  { icon: FileText,        label: 'Reports',    href: '/dashboard/reports',   soon: true  },
  { icon: Zap,             label: 'AI Insights',href: '/dashboard/insights',  soon: true  },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', href: '/dashboard/settings', soon: true },
];

export default function Sidebar() {
  const { handleLogout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useApp();

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen transition-all duration-300 ease-in-out flex-shrink-0',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
      style={{
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo header */}
      <div
        className={cn(
          'flex items-center h-16 px-4 flex-shrink-0',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {sidebarOpen ? (
          <Logo className="h-7" />
        ) : (
          <img src={iconImg} alt="CarbonX" className="h-7 w-7 object-contain" />
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1.5 rounded-lg transition-all',
            !sidebarOpen && 'absolute -right-3.5 top-5 z-10 shadow-lg'
          )}
          style={{
            color: 'var(--text-muted)',
            background: !sidebarOpen ? 'var(--bg-elevated)' : 'transparent',
            border: !sidebarOpen ? '1px solid var(--border)' : 'none',
          }}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen
            ? <ChevronLeft className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'nav-link',
                  isActive && !item.soon && 'active',
                  item.soon && 'opacity-50 cursor-default pointer-events-none',
                  !sidebarOpen && 'justify-center px-2'
                )
              }
              onClick={(e) => item.soon && e.preventDefault()}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="flex-shrink-0" style={{ height: '18px', width: '18px' }} />
              {sidebarOpen && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.soon && <Badge variant="soon">Soon</Badge>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div
        className="px-2 pb-4 pt-4 space-y-1"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              className={cn(
                'nav-link w-full',
                item.soon && 'opacity-50 cursor-default',
                !sidebarOpen && 'justify-center px-2'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="flex-shrink-0" style={{ height: '18px', width: '18px' }} />
              {sidebarOpen && (
                <>
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  {item.soon && <Badge variant="soon">Soon</Badge>}
                </>
              )}
            </button>
          );
        })}

        <button
          onClick={handleLogout}
          className={cn(
            'nav-link w-full transition-colors',
            !sidebarOpen && 'justify-center px-2'
          )}
          style={{ color: 'var(--danger)' }}
          title={!sidebarOpen ? 'Sign Out' : undefined}
        >
          <LogOut className="flex-shrink-0" style={{ height: '18px', width: '18px' }} />
          {sidebarOpen && <span className="flex-1 text-left">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
