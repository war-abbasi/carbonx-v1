import { Bell, Search, Menu } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../../hooks/useAuth';
import { useApp }  from '../../context/AppContext';
import { getInitials } from '../../utils/helpers';

export default function DashboardNav() {
  const { user, handleLogout } = useAuth();
  const { toggleSidebar }      = useApp();

  return (
    <header
      className="h-16 flex items-center justify-between px-6 flex-shrink-0 backdrop-blur-md"
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--nav-bg)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Mobile sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg transition-colors md:hidden"
          style={{ color: 'var(--text-muted)' }}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search bar */}
        <div className="relative hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'var(--text-dim)' }}
          />
          <input
            type="text"
            placeholder="Search…"
            className="w-56 h-9 pl-9 pr-4 rounded-lg text-sm transition-all focus:outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              caretColor: 'var(--accent)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--border-strong)';
              e.target.style.boxShadow   = '0 0 0 2px rgba(var(--accent-rgb),0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow   = 'none';
            }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Bell className="h-5 w-5" />
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
            style={{ background: 'var(--accent)', boxShadow: '0 0 4px var(--accent)' }}
          />
        </button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2.5 p-1.5 pl-2 rounded-lg transition-colors focus:outline-none"
              style={{ color: 'var(--text)' }}
            >
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold leading-none" style={{ color: 'var(--text)' }}>
                  {user?.name}
                </p>
                <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-dim)' }}>
                  {user?.role?.toLowerCase()}
                </p>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <div className="px-3 py-2">
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              style={{ color: 'var(--danger)' }}
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
