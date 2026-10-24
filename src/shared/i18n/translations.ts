/** Same keys as `T`, string values. Makes a missing Arabic or English key a compile error. */
export type Translations<T> = {
  [K in keyof T]: T[K] extends string ? string : Translations<T[K]>;
};
