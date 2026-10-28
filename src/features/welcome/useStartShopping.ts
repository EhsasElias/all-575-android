import { useNavigate, useSearchParams } from 'react-router';
import { logoIntroPath } from './introPaths';
import { markWelcomeSeen } from './welcomeSeen';

/** Leaves the welcome screen for the shopping home and remembers it was seen. */
export function useStartShopping(): () => void {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  return () => {
    markWelcomeSeen();
    void navigate(logoIntroPath(params.get('next')), { replace: true });
  };
}
