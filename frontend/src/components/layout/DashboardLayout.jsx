import { Outlet } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import Sidebar      from './Sidebar';
import DashboardNav from './DashboardNav';

export default function DashboardLayout() {
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: '#F2F5F3' }}>
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <DashboardNav />
          <main className="flex-1 overflow-y-auto" style={{ background: '#F2F5F3' }}>
            <div className="p-6 max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
