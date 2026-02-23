import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { ToastContainer } from '../ui/Toast';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-surface-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <ToastContainer />
    </div>
  );
};
