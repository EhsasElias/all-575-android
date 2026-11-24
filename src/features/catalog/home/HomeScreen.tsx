import { HomeHeader } from './HomeHeader';
import { PopularProducts } from './PopularProducts';
import styles from './HomeScreen.module.css';

/** Only the requested discovery shelves follow the location, search, and banner. */
export function HomeScreen() {
  return (
    <div className={styles.screen}>
      <HomeHeader />
      <PopularProducts />
    </div>
  );
}
