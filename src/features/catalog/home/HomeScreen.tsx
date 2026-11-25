import { HomeHeader } from './HomeHeader';
import { HomeCategorySidebar } from './HomeCategorySidebar';
import { PopularProducts } from './PopularProducts';
import styles from './HomeScreen.module.css';

/** Only the requested discovery shelves follow the location, search, and banner. */
export function HomeScreen() {
  return (
    <div className={styles.screen}>
      <div className={styles.topLayout}>
        <HomeCategorySidebar />
        <HomeHeader />
      </div>
      <PopularProducts />
    </div>
  );
}
