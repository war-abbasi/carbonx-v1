import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Menu } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth }    from '../../hooks/useAuth';
import { useApp }     from '../../context/AppContext';
import { getInitials } from '../../utils/helpers';

/* Map route → page title */
const TITLES = {
  '/dashboard':            'Overview',
  '/dashboard/activities': 'Activities',
  '/dashboard/analytics':  'Analytics',
  '/dashboard/chat':       'AI Chat',
  '/dashboard/insights':   'AI Insights',
  '/dashboard/forecast':   'Emission Forecast',
  '/dashboard/admin':      'Admin Panel',
  '/dashboard/settings':   'Settings',
};

export default function DashboardNav() {
  const { user, handleLogout } = useAuth();
  const { toggleSidebar }      = useApp();
  const location               = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);

  const pageTitle = TITLES[location.pathname] ?? 'Dashboard';

  return (
    <header
      className="h-16 flex items-center justify-between px-5 flex-shrink-0"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #E5EAE8',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Left — mobile toggle + page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg md:hidden transition-colors hover:bg-gray-100"
          style={{ color: '#5A7A6D' }}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold" style={{ color: '#1A2118' }}>{pageTitle}</h1>
          <p className="text-[11px] hidden sm:block" style={{ color: '#9BAEA5' }}>
            CarbonX Intelligence Platform
          </p>
        </div>
      </div>

      {/* Centre — search */}
      <div className="relative hidden sm:block">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
          style={{ color: '#9BAEA5' }}
        />
        <input
          type="text"
          placeholder="Search…"
          className="w-52 h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-all"
          style={{
            background: searchFocused ? '#ffffff' : '#F4F6F4',
            border: `1px solid ${searchFocused ? '#2D6A4F' : '#E5EAE8'}`,
            color: '#1A2118',
            boxShadow: searchFocused ? '0 0 0 3px rgba(45,106,79,0.08)' : 'none',
          }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* Right — notifications + user */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-gray-50"
          style={{ color: '#7A9E8E' }}
        >
          <Bell className="h-[18px] w-[18px]" />
          <span
            className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
            style={{ background: '#C4952A' }}
          />
        </button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-gray-50 focus:outline-none"
            >
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold leading-none" style={{ color: '#1A2118' }}>
                  {user?.name}
                </p>
                <p className="text-[10px] mt-0.5 capitalize" style={{ color: '#9BAEA5' }}>
                  {user?.role?.toLowerCase() ?? 'member'}
                </p>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className="text-xs font-semibold text-white"
                  style={{ background: '#2D6A4F' }}
                >
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
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} style={{ color: '#DC2626' }}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
