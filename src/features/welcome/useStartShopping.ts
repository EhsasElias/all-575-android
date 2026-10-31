import { useNavigate } from 'react-router';
import { routePaths } from '@/shared/lib';
import { markWelcomeSeen } from './welcomeSeen';

/** The explicit "shop now" action always opens Home, never a saved auth/deep-link route. */
export function useStartShopping(): () => void {
  const navigate = useNavigate();

  return () => {
    markWelcomeSeen();
    void navigate(routePaths.home, { replace: true });
  };
}
