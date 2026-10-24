import { useLocation, useNavigate } from 'react-router';
import { Button, ButtonLink, Icon } from '@/shared/ui';
import { useDirectionalIcons } from './useDirectionalIcons';
import styles from './BackLink.module.css';

type BackLinkProps = {
  /** Where "back" goes. */
  to: string;
  label: string;
  /** Go to the screen the customer came from when there is one (e.g. from the sign-in consent step). */
  preferHistory?: boolean;
};

export function BackLink({ to, label, preferHistory = false }: BackLinkProps) {
  const navigate = useNavigate();
  // The first screen of a visit has the key "default": there is nothing to go back to.
  const hasHistory = useLocation().key !== 'default';
  const { back } = useDirectionalIcons();
  const content = (
    <>
      <Icon name={back} size={20} />
      {label}
    </>
  );

  if (preferHistory && hasHistory) {
    return (
      <Button
        variant="ghost"
        className={styles.back}
        onClick={() => {
          void navigate(-1);
        }}
      >
        {content}
      </Button>
    );
  }
  return (
    <ButtonLink variant="ghost" to={to} className={styles.back}>
      {content}
    </ButtonLink>
  );
}
