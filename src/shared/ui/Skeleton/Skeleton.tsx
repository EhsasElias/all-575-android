import { cx } from '@/shared/lib';
import styles from './Skeleton.module.css';

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  /** Fully round, for avatars and dots. */
  circle?: boolean;
  className?: string | undefined;
};

/** A placeholder block. Pair a group of them with a visible or hidden "Loading" label. */
export function Skeleton({
  width = '100%',
  height = '1em',
  circle = false,
  className,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(styles.skeleton, circle && styles.circle, className)}
      style={{ inlineSize: width, blockSize: height }}
    />
  );
}
