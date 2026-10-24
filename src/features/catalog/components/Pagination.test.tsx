import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render';
import { installCatalogApi, queriesOf } from '../testApi';
import { biscuits, makeProduct, NEXT_PRODUCTS_URL, notebook, page, socks } from '../testData';
import { installFakeIntersectionObserver } from '../testIntersection';

const second = makeProduct({
  id: 40,
  slug: 'second-page',
  name: { ar: 'الثاني', en: 'Second page item' },
});

function twoPages(overrides: { secondPage?: () => { status?: number; body: unknown } } = {}) {
  return installCatalogApi({
    'GET /products': ({ query }) =>
      query.get('cursor') === 'page2'
        ? (overrides.secondPage?.() ?? { body: page([second]) })
        : { body: page([biscuits, socks], NEXT_PRODUCTS_URL) },
  });
}

describe('Paging through products', () => {
  it('shows a Load more button, follows links.next as is, and adds the next page below', async () => {
    const api = twoPages();
    const user = userEvent.setup();
    await renderApp({ route: '/categories/food', seenWelcome: true });
    await screen.findByRole('link', { name: 'Biscuits' });

    await user.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('link', { name: 'Second page item' })).toBeVisible();
    const queries = queriesOf(api, 'GET /products');
    expect(queries).toHaveLength(2);
    expect(queries[1]?.get('cursor')).toBe('page2');
    expect(queries[1]?.get('category')).toBe('food');
    // The first page is still there, and the button is gone: this was the last page.
    expect(screen.getByRole('link', { name: 'Biscuits' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('moves the focus to the first new product after the Load more button was used', async () => {
    twoPages();
    const user = userEvent.setup();
    await renderApp({ route: '/categories/food', seenWelcome: true });

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Second page item' })).toHaveFocus();
    });
  });

  it('does not take the focus when the page loaded by itself while scrolling', async () => {
    const observer = installFakeIntersectionObserver();
    twoPages();
    await renderApp({ route: '/categories/food', seenWelcome: true });
    await screen.findByRole('link', { name: 'Biscuits' });
    await waitFor(() => {
      expect(observer.activeCount()).toBe(1);
    });

    act(() => {
      observer.reachEnd();
    });

    expect(await screen.findByRole('link', { name: 'Second page item' })).not.toHaveFocus();
  });

  it('has no button when everything fits on one page', async () => {
    installCatalogApi({ 'GET /products': { body: page([notebook]) } });
    await renderApp({ route: '/categories/food', seenWelcome: true });
    await screen.findByRole('link', { name: 'Notebook' });

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('keeps the page on screen and offers a retry when the next page fails', async () => {
    let attempt = 0;
    twoPages({
      secondPage: () => {
        attempt += 1;
        return attempt === 1 ? { status: 400, body: { message: 'x' } } : { body: page([second]) };
      },
    });
    const user = userEvent.setup();
    await renderApp({ route: '/categories/food', seenWelcome: true });
    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load more results');
    expect(screen.getByRole('link', { name: 'Biscuits' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Second page item' })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('loads the next page by itself when the end of the list scrolls into view', async () => {
    const observer = installFakeIntersectionObserver();
    const api = twoPages();
    await renderApp({ route: '/categories/food', seenWelcome: true });
    await screen.findByRole('link', { name: 'Biscuits' });
    await waitFor(() => {
      expect(observer.activeCount()).toBe(1);
    });

    act(() => {
      observer.reachEnd();
    });

    expect(await screen.findByRole('link', { name: 'Second page item' })).toBeVisible();
    expect(queriesOf(api, 'GET /products')).toHaveLength(2);
    // Nothing left to load, so nothing is watching any more.
    await waitFor(() => {
      expect(observer.activeCount()).toBe(0);
    });
  });

  it('does not retry a failed page by itself, so a bad connection cannot cause a request loop', async () => {
    const observer = installFakeIntersectionObserver();
    const api = twoPages({ secondPage: () => ({ status: 400, body: { message: 'x' } }) });
    const user = userEvent.setup();
    await renderApp({ route: '/categories/food', seenWelcome: true });
    await user.click(await screen.findByRole('button', { name: 'Load more' }));
    await screen.findByRole('alert');

    expect(observer.activeCount()).toBe(0);
    act(() => {
      observer.reachEnd();
    });

    expect(queriesOf(api, 'GET /products')).toHaveLength(2);
  });

  it('shows that more is loading, to the eye and to screen readers, until the page arrives', async () => {
    twoPages();
    const realFetch = globalThis.fetch;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      if ((input instanceof Request ? input.url : input.toString()).includes('cursor=page2'))
        await gate;
      return realFetch(input, init);
    });
    const user = userEvent.setup();
    await renderApp({ route: '/categories/food', seenWelcome: true });
    const button = await screen.findByRole('button', { name: 'Load more' });

    await user.click(button);

    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading more…')).toBeInTheDocument();

    release();
    expect(await screen.findByRole('link', { name: 'Second page item' })).toBeVisible();
    expect(screen.queryByText('Loading more…')).not.toBeInTheDocument();
  });
});
