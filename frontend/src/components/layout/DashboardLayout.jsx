import { Outlet } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import Sidebar from './Sidebar';
import DashboardNav from './DashboardNav';

export default function DashboardLayout() {
  return (
    <AppProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <DashboardNav />
          <main className="flex-1 overflow-y-auto p-6 bg-grid">
            <Outlet />
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
