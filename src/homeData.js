import { assets, PRICE } from './data.js';

const approvedAssets = new Set(
  Object.values(assets)
);

const categoryAssetBySlug = {
  food: assets.food,
  pharmacy: assets.pharmacy,
  meat: assets.meat,
  groceries: assets.groceries,
  gifts: assets.gifts,
  'pet-supplies': assets.pets,
};

function approvedImage(
  value,
  fallback
) {
  return approvedAssets.has(value)
    ? value
    : fallback;
}

function slideAction(link) {
  const value = String(
    link || ''
  ).replace(/^\/+/, '');

  if (
    value ===
    'seller-register'
  ) {
    return 'seller-register';
  }

  if (
    value ===
    'categories'
  ) {
    return 'categories';
  }

  return 'home';
}

export const emptyStore = {
  categories: [],

  sellers: [],

  products: [],

  slides: [],

  orders: [],

  sellerApplications: [],

  customers: [],

  storeSettings: {
    nameAr:
      'الكل بـ 5,75',

    nameEn:
      'Everything 5.75',

    supportPhone: '',

    deliveryFee: 0,

    productPrice:
      PRICE,

    currencyAr:
      'ر.س',

    currencyEn:
      'SAR',
  },
};

export function mapHomeResponse(
  home = {}
) {
  /*
  |--------------------------------------------------------------------------
  | Categories
  |--------------------------------------------------------------------------
  */

  const categories = (
    home.categories || []
  ).map((item) => ({
    id:
      Number(item.id),

    slug:
      item.slug,

    nameAr:
      item.name_ar,

    nameEn:
      item.name_en,

    image:
      approvedImage(
        item.image,

        categoryAssetBySlug[
          item.slug
        ] ||
          assets.groceries
      ),

    subtitleAr: '',

    subtitleEn: '',
  }));

  const categoryById =
    new Map(
      categories.map(
        (item) => [
          item.id,
          item,
        ]
      )
    );

  /*
  |--------------------------------------------------------------------------
  | Store Price
  |--------------------------------------------------------------------------
  */

  const fixedPrice =
    Number(
      home.store?.price ??
        PRICE
    );

  /*
  |--------------------------------------------------------------------------
  | Products
  |--------------------------------------------------------------------------
  |
  | Laravel sends featured_products and latest_products separately.
  | We combine them here and remove duplicates.
  |
  */

  const rawProducts = [
    ...(
      home.featured_products ||
      []
    ),

    ...(
      home.latest_products ||
      []
    ),
  ];

  const uniqueProducts = [
    ...new Map(
      rawProducts.map(
        (item) => [
          Number(item.id),
          item,
        ]
      )
    ).values(),
  ];

  const products =
    uniqueProducts.map(
      (item) => {
        const category =
          categoryById.get(
            Number(
              item.category_id
            )
          );

        return {
          id:
            Number(
              item.id
            ),

          category:
            Number(
              item.category_id
            ),

          sellerId:
            item.seller_id ==
            null
              ? null
              : Number(
                  item.seller_id
                ),

          nameAr:
            item.name_ar,

          nameEn:
            item.name_en,

          descriptionAr:
            item.description_ar ||
            '',

          descriptionEn:
            item.description_en ||
            '',

          price:
            Number(
              item.price ??
                fixedPrice
            ),

          stock:
            Number(
              item.stock ||
                0
            ),

          sku:
            item.sku ||
            '',

          image:
            approvedImage(
              item.image,

              category?.image ||
                assets.groceries
            ),

          featured:
            Boolean(
              item.is_featured
            ),
        };
      }
    );

  /*
  |--------------------------------------------------------------------------
  | Seller Image Fallback
  |--------------------------------------------------------------------------
  |
  | If seller does not have a logo, use the image of one of their products.
  |
  */

  const firstProductBySeller =
    new Map();

  products.forEach(
    (product) => {
      if (
        product.sellerId &&
        !firstProductBySeller.has(
          product.sellerId
        )
      ) {
        firstProductBySeller.set(
          product.sellerId,
          product
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Sellers
  |--------------------------------------------------------------------------
  */

  const sellers = (
    home.sellers || []
  ).map((item) => ({
    id:
      Number(item.id),

    nameAr:
      item.name_ar,

    nameEn:
      item.name_en,

    descriptionAr:
      item.description_ar ||
      '',

    descriptionEn:
      item.description_en ||
      '',

    image:
      approvedImage(
        item.logo,

        firstProductBySeller.get(
          Number(item.id)
        )?.image ||
          assets.groceries
      ),

    rating: null,

    verified: true,
  }));

  /*
  |--------------------------------------------------------------------------
  | Slider
  |--------------------------------------------------------------------------
  */

  const tones = [
    'green',
    'yellow',
    'orange',
  ];

  const slideFallbacks = [
    assets.groceries,
    assets.gifts,
    assets.food,
  ];

  const slides = (
    home.sliders || []
  ).map(
    (
      item,
      index
    ) => ({
      id:
        Number(
          item.id
        ),

      tone:
        tones[
          index %
            tones.length
        ],

      titleAr:
        item.title_ar,

      titleEn:
        item.title_en,

      textAr:
        item.description_ar ||
        '',

      textEn:
        item.description_en ||
        '',

      ctaAr:
        item.button_text_ar ||
        '',

      ctaEn:
        item.button_text_en ||
        '',

      image:
        approvedImage(
          item.image,

          slideFallbacks[
            index %
              slideFallbacks.length
          ]
        ),

      action:
        slideAction(
          item.link
        ),
    })
  );

  /*
  |--------------------------------------------------------------------------
  | Final Store Object
  |--------------------------------------------------------------------------
  */

  return {
    ...emptyStore,

    categories,

    sellers,

    products,

    slides,

    storeSettings: {
      ...emptyStore
        .storeSettings,

      productPrice:
        fixedPrice,

      deliveryFee:
        Number(
          home.store
            ?.delivery_fee ||
            0
        ),

      currencyEn:
        home.store
          ?.currency ||
        'SAR',
    },
  };
}