import type { CareItems, CustomerCase } from './api';
export const caseFixture: CustomerCase = {
  id: 'case-a',
  order_id: 'order-a',
  kind: 'support',
  status: 'submitted',
  subject: 'Late delivery',
  order_item_id: null,
  quantity: null,
  created_at: '2026-10-27T10:00:00Z',
  updated_at: '2026-10-27T10:00:00Z',
  messages: [
    {
      id: 1,
      author: 'customer',
      body: 'Please check my delivery.',
      created_at: '2026-10-27T10:00:00Z',
    },
  ],
};
export const careItemsFixture: CareItems = [
  {
    id: 7,
    name: { ar: 'تيشيرت', en: 'T-shirt' },
    variant_name: { ar: 'M', en: 'M' },
    quantity: 2,
    returnable_quantity: 2,
  },
];
