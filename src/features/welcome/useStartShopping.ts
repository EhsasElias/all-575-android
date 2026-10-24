import { useNavigate } from 'react-router';
import { routePaths } from '@/shared/lib';
import { markWelcomeSeen } from './welcomeSeen';

/** Leaves the welcome screen for the shopping home and remembers it was seen. */
export function useStartShopping(): () => void {
  const navigate = useNavigate();

  return () => {
    markWelcomeSeen();
    void navigate(routePaths.home);
  };
}
