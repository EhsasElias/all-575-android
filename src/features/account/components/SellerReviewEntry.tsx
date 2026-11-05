import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { http } from '@/shared/api';
import { routePaths } from '@/shared/lib';

/** The link is shown only when the server confirms an active reviewer grant. */
export function SellerReviewEntry() {
  const { i18n } = useTranslation();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    void http
      .get('/seller-review/applications', { query: { limit: 1 } })
      .then(() => {
        if (active) setAllowed(true);
      })
      .catch(() => {
        if (active) setAllowed(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!allowed) return null;
  return (
    <p>
      <Link to={routePaths.sellerReview}>
        {i18n.language.startsWith('ar')
          ? 'مراجعة طلبات البائعين والمنتجات (إدارة)'
          : 'Seller & product approvals (Admin)'}
      </Link>
    </p>
  );
}
