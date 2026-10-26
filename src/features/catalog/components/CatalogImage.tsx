import { useState } from 'react';
import { traceImageFailure } from '@/shared/api';
import { cx } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import styles from './CatalogImage.module.css';

type CatalogImageProps = {
  /** The picture, or null: a placeholder takes its place, and also when the picture cannot be loaded. */
  src: string | null;
  /** Empty when the name is written right next to the picture. */
  alt: string;
  /** The size the picture is drawn at, in CSS pixels. It reserves the space, so nothing jumps when it loads. */
  size: number;
  /** Eager for what is on screen at first paint, lazy for everything below. */
  eager?: boolean;
  round?: boolean;
  className?: string | undefined;
};

export function CatalogImage({
  src,
  alt,
  size,
  eager = false,
  round = false,
  className,
}: CatalogImageProps) {
  const [failed, setFailed] = useState(false);
  const showPicture = src !== null && !failed;

  return (
    <div className={cx(styles.frame, round && styles.round, className)}>
      {showPicture ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className={styles.picture}
          onError={() => {
            traceImageFailure(src);
            setFailed(true);
          }}
        />
      ) : (
        <Icon name="package" size={Math.round(size / 3)} className={styles.placeholder} />
      )}
    </div>
  );
}
