import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from './stores/authStore';

export const App = () => {
  const { checkAuth, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();

    const handler = () => logout();
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, []);

  return <RouterProvider router={router} />;
};
