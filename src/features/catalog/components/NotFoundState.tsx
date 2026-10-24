import { ButtonLink, EmptyState } from '@/shared/ui';

type NotFoundStateProps = {
  title: string;
  message: string;
  actionLabel: string;
  actionTo: string;
};

/** A page that exists as a route but whose product, category or seller does not. Always the page's h1. */
export function NotFoundState({ title, message, actionLabel, actionTo }: NotFoundStateProps) {
  return (
    <EmptyState
      headingLevel={1}
      icon="info"
      title={title}
      message={message}
      action={<ButtonLink to={actionTo}>{actionLabel}</ButtonLink>}
    />
  );
}
