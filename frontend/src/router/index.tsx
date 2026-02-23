import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { JamSyncLayout } from '../components/layout/JamSyncLayout';
import { AuthPage } from '../pages/AuthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MatchPage } from '../pages/MatchPage';
import { ProfilePage } from '../pages/ProfilePage';
import { JamModePage } from '../pages/JamModePage';
import { EditorPage } from '../pages/EditorPage';
import { PlaylistsPage } from '../pages/PlaylistsPage';
import { SheetViewPage } from '../pages/SheetViewPage';
import { HubDashboardPage } from '../pages/hub/HubDashboardPage';
import { ProjectsPage } from '../pages/hub/ProjectsPage';
import { ProjectDetailPage } from '../pages/hub/ProjectDetailPage';
import { TasksPage } from '../pages/hub/TasksPage';
import { CalendarPage } from '../pages/hub/CalendarPage';
import { useAuthStore } from '../stores/authStore';
import { ReactNode } from 'react';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-purple-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
  // Public
  {
    path: '/auth',
    element: <AuthPage />,
  },

  // Full-screen jam mode (no layout)
  {
    path: '/jam/:sessionId',
    element: (
      <ProtectedRoute>
        <JamModePage />
      </ProtectedRoute>
    ),
  },

  // Hub — Projects Hub layout
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HubDashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'calendar', element: <CalendarPage /> },
    ],
  },

  // JamSync — standalone layout
  {
    path: '/jamsync',
    element: (
      <ProtectedRoute>
        <JamSyncLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'match', element: <MatchPage /> },
      { path: 'playlists', element: <PlaylistsPage /> },
      { path: 'editor', element: <EditorPage /> },
      { path: 'sheets/:songId', element: <SheetViewPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'schedule', element: <Navigate to="/jamsync" replace /> },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
