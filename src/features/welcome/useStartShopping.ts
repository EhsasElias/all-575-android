import { useNavigate, useSearchParams } from 'react-router';
import { afterIntroPath } from './introPaths';
import { markWelcomeSeen } from './welcomeSeen';

/** Leaves the welcome screen for the shopping home and remembers it was seen. */
export function useStartShopping(): () => void {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  return () => {
    markWelcomeSeen();
    void navigate(afterIntroPath(params.get('next')), { replace: true });
  };
}
