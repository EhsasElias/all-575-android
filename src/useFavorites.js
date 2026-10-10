import {
  useCallback,
  useEffect,
  useState,
} from 'react';

export default function useFavorites({
  api,
  currentUser,
  lang,
  showToast,
  go,
}) {
  const [
    favoriteIds,
    setFavoriteIds,
  ] = useState([]);

  const [
    favoritesLoading,
    setFavoritesLoading,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load Favorites
  |--------------------------------------------------------------------------
  */

  const loadFavorites =
    useCallback(async () => {
      if (!currentUser) {
        setFavoriteIds([]);
        return;
      }

      setFavoritesLoading(true);

      try {
        const response =
          await api.getFavorites();

        const products =
          Array.isArray(
            response?.data
          )
            ? response.data
            : [];

        setFavoriteIds(
          products.map(
            (product) =>
              Number(product.id)
          )
        );
      } catch (error) {
        console.error(
          'Favorites load error:',
          error
        );

        setFavoriteIds([]);
      } finally {
        setFavoritesLoading(false);
      }
    }, [
      api,
      currentUser,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Reload when user changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadFavorites();
  }, [
    loadFavorites,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Toggle Favorite
  |--------------------------------------------------------------------------
  */

  async function toggleFavorite(
    productId
  ) {
    if (!currentUser) {
      showToast(
        lang === 'ar'
          ? 'سجل الدخول أولاً لحفظ المفضلة'
          : 'Sign in first to save favorites'
      );

      go('login');

      return;
    }

    const id =
      Number(productId);

    const isFavorite =
      favoriteIds.includes(id);

    try {
      if (isFavorite) {
        await api.removeFavorite(
          id
        );

        setFavoriteIds(
          (current) =>
            current.filter(
              (item) =>
                item !== id
            )
        );

        showToast(
          lang === 'ar'
            ? 'تمت الإزالة من المفضلة'
            : 'Removed from favorites'
        );
      } else {
        await api.addFavorite(
          id
        );

        setFavoriteIds(
          (current) =>
            current.includes(id)
              ? current
              : [
                  ...current,
                  id,
                ]
        );

        showToast(
          lang === 'ar'
            ? 'تمت الإضافة إلى المفضلة'
            : 'Added to favorites'
        );
      }
    } catch (error) {
      console.error(
        'Favorite toggle error:',
        error
      );

      showToast(
        error?.message ||
        (
          lang === 'ar'
            ? 'تعذر تحديث المفضلة'
            : 'Could not update favorites'
        )
      );
    }
  }

  return {
    favoriteIds,
    favoritesLoading,
    toggleFavorite,
    reloadFavorites:
      loadFavorites,
  };
}