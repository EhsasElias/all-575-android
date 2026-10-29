import styles from './PaymentBrand.module.css';

type Method = 'mada' | 'card' | 'apple_pay' | 'cash_on_delivery' | 'none';
const BRANDS = {
  mada: [{ file: 'mada.svg', name: 'mada' }],
  card: [
    { file: 'visa.svg', name: 'Visa' },
    { file: 'master.svg', name: 'Mastercard' },
  ],
  apple_pay: [{ file: 'apple_pay.svg', name: 'Apple Pay' }],
  cash_on_delivery: [{ file: 'cash.jpg', name: '' }],
  none: [],
} satisfies Record<Method, { file: string; name: string }[]>;

/** Supplied brand artwork, served locally so checkout needs no third-party image request. */
export function PaymentBrand({ method }: { method: Method }) {
  return (
    <span className={styles.brands}>
      {BRANDS[method].map(({ file, name }) => (
        <img
          key={file}
          src={`/images/payments/${file}`}
          alt={name}
          width={56}
          height={36}
          className={styles.image}
        />
      ))}
    </span>
  );
}
