import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SchedulePage = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/jamsync', { replace: true }); }, [navigate]);
  return null;
};
