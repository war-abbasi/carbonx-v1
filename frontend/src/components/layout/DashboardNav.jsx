import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Search, Menu, LayoutDashboard, Activity, BarChart3,
  MessageSquare, Sparkles, BrainCircuit, ShieldCheck, Settings as SettingsIcon,
  Target, AlertTriangle, CheckCircle2, CornerDownLeft,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth }    from '../../hooks/useAuth';
import { useApp }     from '../../context/AppContext';
import { useAuthStore } from '../../store/authStore';
import { goalsApi }   from '../../api/goalsApi';
import { getInitials } from '../../utils/helpers';

/* Map route → page title */
const TITLES = {
  '/dashboard':             'Overview',
  '/dashboard/activities':  'Activities',
  '/dashboard/analytics':   'Analytics',
  '/dashboard/chat':        'AI Chat',
  '/dashboard/insights':    'AI Insights',
  '/dashboard/carboncastx': 'CarboncastX',
  '/dashboard/admin':       'Admin Panel',
  '/dashboard/settings':    'Settings',
};

/* Searchable destinations */
const DESTINATIONS = [
  { label: 'Overview',    href: '/dashboard',             icon: LayoutDashboard, kw: 'home dashboard' },
  { label: 'Activities',  href: '/dashboard/activities',  icon: Activity,        kw: 'log entries carbon' },
  { label: 'Analytics',   href: '/dashboard/analytics',   icon: BarChart3,       kw: 'charts trends scopes' },
  { label: 'AI Chat',     href: '/dashboard/chat',        icon: MessageSquare,   kw: 'assistant' },
  { label: 'AI Insights', href: '/dashboard/insights',    icon: Sparkles,        kw: 'recommendations challenges goals' },
  { label: 'CarboncastX', href: '/dashboard/carboncastx', icon: BrainCircuit,    kw: 'forecast prediction ml ai' },
  { label: 'Goals',       href: '/dashboard/insights',    icon: Target,          kw: 'targets reduction' },
  { label: 'Settings',    href: '/dashboard/settings',    icon: SettingsIcon,    kw: 'profile password account' },
  { label: 'Admin Panel', href: '/dashboard/admin',       icon: ShieldCheck,     kw: 'users import csv', adminOnly: true },
];

export default function DashboardNav() {
  const { user, handleLogout } = useAuth();
  const { toggleSidebar }      = useApp();
  const { user: storeUser }    = useAuthStore();
  const isAdmin                = storeUser?.role === 'ADMIN';
  const location               = useLocation();
  const navigate               = useNavigate();

  const [query, setQuery]       = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef               = useRef(null);

  const [notifs, setNotifs]     = useState([]);
  const [seen, setSeen]         = useState(true);

  const pageTitle = TITLES[location?.pathname] ?? 'Dashboard';

  /* Build notifications from live data (over-target goals + nudges) */
  useEffect(() => {
    let active = true;
    goalsApi.list()
      .then(({ data: res }) => {
        if (!active) return;
        const d = res.data ?? {};
        const items = [];
        (d.goals ?? []).forEach((g) => {
          if (!g.onTrack) items.push({
            type: 'warn', title: `Over target: ${g.title}`,
            body: `${g.currentKg?.toLocaleString()} / ${g.targetKg?.toLocaleString()} kg this month (${g.progressPct}%).`,
            href: '/dashboard/insights',
          });
        });
        if ((d.goals ?? []).length === 0) {
          items.push({ type: 'info', title: 'Set a monthly target',
            body: 'Track your footprint against a goal in AI Insights → My Goals.', href: '/dashboard/insights' });
        }
        if ((d.currentMonthKg ?? 0) === 0) {
          items.push({ type: 'info', title: 'No activity logged this month',
            body: 'Log entries to keep your analytics and forecast fresh.', href: '/dashboard/activities' });
        }
        setNotifs(items);
        // unseen if the set of titles changed since last open
        const sig = items.map((i) => i.title).join('|');
        setSeen(localStorage.getItem('carbonx_notif_seen') === sig);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [location?.pathname]);

  const markSeen = () => {
    const sig = notifs.map((i) => i.title).join('|');
    localStorage.setItem('carbonx_notif_seen', sig);
    setSeen(true);
  };

  /* Search results */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = DESTINATIONS.filter((d) => !d.adminOnly || isAdmin);
    if (!q) return pool;
    return pool.filter((d) => d.label.toLowerCase().includes(q) || d.kw.includes(q));
  }, [query, isAdmin]);

  const go = (href) => { setSearchOpen(false); setQuery(''); navigate(href); };

  const onSearchKey = (e) => {
    if (e.key === 'Enter' && results[0]) go(results[0].href);
    if (e.key === 'Escape') { setSearchOpen(false); e.target.blur(); }
  };

  const unread = notifs.length > 0 && !seen;

  return (
    <header className="h-16 flex items-center justify-between px-5 flex-shrink-0"
      style={{ background: '#ffffff', borderBottom: '1px solid #E5EAE8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Left — toggle + title */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-lg md:hidden transition-colors hover:bg-gray-100" style={{ color: '#5A7A6D' }}>
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold" style={{ color: '#1A2118' }}>{pageTitle}</h1>
          <p className="text-[11px] hidden sm:block" style={{ color: '#9BAEA5' }}>CarbonX Intelligence Platform</p>
        </div>
      </div>

      {/* Centre — functional search */}
      <div className="relative hidden sm:block" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: '#9BAEA5' }} />
        <input
          type="text" placeholder="Search pages…" value={query}
          onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          onKeyDown={onSearchKey}
          className="w-56 h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-all"
          style={{ background: searchOpen ? '#fff' : '#F4F6F4', border: `1px solid ${searchOpen ? '#2D6A4F' : '#E5EAE8'}`,
                   color: '#1A2118', boxShadow: searchOpen ? '0 0 0 3px rgba(45,106,79,0.08)' : 'none' }}
        />
        {searchOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-xl py-1.5 z-50 max-h-80 overflow-y-auto"
            style={{ background: '#fff', border: '1px solid #E5EAE8', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}>
            {results.length ? results.map((d) => {
              const Icon = d.icon;
              return (
                <button key={d.label + d.href} onMouseDown={(e) => { e.preventDefault(); go(d.href); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50">
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: '#7A9E8E' }} />
                  <span className="text-sm flex-1" style={{ color: '#3D5247' }}>{d.label}</span>
                </button>
              );
            }) : (
              <p className="px-3 py-3 text-sm" style={{ color: '#9BAEA5' }}>No matches.</p>
            )}
            <div className="px-3 pt-1.5 mt-1 flex items-center gap-1 text-[10px]" style={{ borderTop: '1px solid #F0EDE4', color: '#C0CCC6' }}>
              <CornerDownLeft className="h-3 w-3" /> Enter to open first result
            </div>
          </div>
        )}
      </div>

      {/* Right — notifications + user */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu onOpenChange={(o) => o && markSeen()}>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-lg transition-colors hover:bg-gray-50" style={{ color: '#7A9E8E' }}>
              <Bell className="h-[18px] w-[18px]" />
              {unread && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full" style={{ background: '#DC2626' }} />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span style={{ color: '#1A2118' }}>Notifications</span>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full" style={{ background: '#F4F6F4', color: '#9BAEA5' }}>{notifs.length}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifs.length ? notifs.map((n, i) => (
              <DropdownMenuItem key={i} onClick={() => navigate(n.href)} className="items-start gap-2.5 py-2.5">
                {n.type === 'warn'
                  ? <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#C4952A' }} />
                  : <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#2D6A4F' }} />}
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1A2118' }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>{n.body}</p>
                </div>
              </DropdownMenuItem>
            )) : (
              <div className="px-3 py-6 text-center">
                <CheckCircle2 className="h-7 w-7 mx-auto mb-2" style={{ color: '#C0DDD0' }} />
                <p className="text-sm" style={{ color: '#9BAEA5' }}>You're all caught up.</p>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-gray-50 focus:outline-none">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold leading-none" style={{ color: '#1A2118' }}>{user?.name}</p>
                <p className="text-[10px] mt-0.5 capitalize" style={{ color: '#9BAEA5' }}>{user?.role?.toLowerCase() ?? 'member'}</p>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold text-white" style={{ background: '#2D6A4F' }}>
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="pb-1">
              <p className="text-sm font-semibold" style={{ color: '#1A2118' }}>{user?.name}</p>
              <p className="text-xs font-normal truncate" style={{ color: '#9BAEA5' }}>{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} style={{ color: '#DC2626' }}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
