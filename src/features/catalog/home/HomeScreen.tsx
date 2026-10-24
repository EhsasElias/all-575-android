import { CategoryStrip } from './CategoryStrip';
import { HomeHeader } from './HomeHeader';
import { PopularProducts } from './PopularProducts';
import styles from './HomeScreen.module.css';

/** The first screen after the welcome slider. Categories and products load side by side. */
export function HomeScreen() {
  return (
    <div className={styles.screen}>
      <HomeHeader />
      <CategoryStrip />
      <PopularProducts />
    </div>
  );
}
