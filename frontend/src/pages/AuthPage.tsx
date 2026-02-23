import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';

// Must be a direct URL — OAuth redirects must bypass the Vite proxy
// so browser cookies are set by the backend directly (not via proxy)
const API_URL = import.meta.env.VITE_API_URL || '';

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    if (searchParams.get('error') === 'oauth_failed') {
      toast.error('Google sign-in failed. Please try again.');
    }
  }, []);

  const handleGoogleSignIn = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-pink/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple-light to-accent-pink shadow-[0_0_40px_rgba(168,85,247,0.5)] mb-4">
            <Mic2 size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">JamSync</h1>
          <p className="text-white/50 mt-1 text-sm">Find your perfect jam session</p>
        </div>

        {/* Sign-in card */}
        <div className="bg-surface-800 rounded-2xl border border-white/5 p-8 shadow-2xl flex flex-col items-center gap-6">
          <p className="text-white/70 text-sm text-center">
            Sign in with your Google account to get started
          </p>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-white/90 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {/* Google "G" logo */}
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </motion.div>
      <ToastContainer />
    </div>
  );
};
