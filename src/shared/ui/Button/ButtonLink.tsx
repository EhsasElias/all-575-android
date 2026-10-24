import { Link, type LinkProps } from 'react-router';
import { buttonClassName, type ButtonStyleProps } from './buttonStyles';

export type ButtonLinkProps = LinkProps & ButtonStyleProps;

/** A real link (navigation) that looks like a Button. */
export function ButtonLink({ variant, size, fullWidth, className, ...rest }: ButtonLinkProps) {
  return <Link {...rest} className={buttonClassName({ variant, size, fullWidth }, className)} />;
}
