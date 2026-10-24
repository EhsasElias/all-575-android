export type WelcomeSlide = {
  id: 'fruit' | 'household' | 'clothing';
  image: string;
  /** Card background. The same in light and dark themes: the card stays light. */
  tint: string;
  /** Corner badge color. */
  badge: string;
};

export const WELCOME_SLIDES: readonly WelcomeSlide[] = [
  { id: 'fruit', image: '/images/welcome/welcome-fruit.webp', tint: '#edf1e0', badge: '#da2842' },
  {
    id: 'household',
    image: '/images/welcome/welcome-household.webp',
    tint: '#e4f1e5',
    badge: '#008d48',
  },
  {
    id: 'clothing',
    image: '/images/welcome/welcome-clothing.webp',
    tint: '#e7f1f5',
    badge: '#02a8b7',
  },
];

export const SLIDE_IMAGE_SIZE = { width: 608, height: 616 };
export const SLIDE_DURATION_MS = 4500;

/** The "everything for 5.75" promise, as integer halalas. */
export const PROMISE_PRICE_HALALAS = 575;
