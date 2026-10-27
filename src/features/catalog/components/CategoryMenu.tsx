import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { routePaths, routeTo } from '@/shared/lib';
import { Button, Icon, Skeleton } from '@/shared/ui';
import { useCategories } from '../api/useCatalogQueries';
import { pickText } from '../lib/localized';
import styles from './CategoryMenu.module.css';

export function CategoryMenu({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation();
  const { language } = useLanguage();
  const categories = useCategories();

  return (
    <details className={styles.group}>
      <summary className={styles.summary}>
        <Icon name="grid" />
        <span>{t('home.categoriesTitle')}</span>
        <Icon name="chevron-down" size={18} className={styles.arrow} />
      </summary>
      <div className={styles.content}>
        {categories.isPending && <Skeleton height="3rem" />}
        {categories.isError && (
          <Button
            variant="ghost"
            onClick={() => {
              void categories.refetch();
            }}
          >
            {tCommon('actions.retry')}
          </Button>
        )}
        <ul className={styles.list}>
          {categories.data?.map((category) => (
            <li key={category.id}>
              <Link to={routeTo.categoryProducts(category.slug)} onClick={onNavigate}>
                {pickText(category.name, language)}
              </Link>
              {(category.children?.length ?? 0) > 0 && (
                <ul className={styles.children}>
                  {category.children?.map((child) => (
                    <li key={child.id}>
                      <Link to={routeTo.categoryProducts(child.slug)} onClick={onNavigate}>
                        {pickText(child.name, language)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <Link to={routePaths.categories} onClick={onNavigate} className={styles.all}>
          {t('search.browseAll')}
        </Link>
      </div>
    </details>
  );
}
