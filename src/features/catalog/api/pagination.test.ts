import { describe, expect, it } from 'vitest';
import { nextPageQuery } from './pagination';

describe('nextPageQuery', () => {
  it('keeps every parameter of links.next, so the next request asks for the same list', () => {
    expect(
      nextPageQuery(
        'http://127.0.0.1:8000/api/v1/products?zone_id=1&per_page=3&cursor=eyJpZCI6N30',
      ),
    ).toEqual({ zone_id: '1', per_page: '3', cursor: 'eyJpZCI6N30' });
  });

  it('has no next page when the link is null or empty', () => {
    expect(nextPageQuery(null)).toBeNull();
    expect(nextPageQuery('')).toBeNull();
  });

  it('has no next page when the link carries no query', () => {
    expect(nextPageQuery('http://127.0.0.1:8000/api/v1/products')).toBeNull();
  });

  it('only uses the query: the host of the link is never used for the request', () => {
    const query = nextPageQuery('https://evil.example/steal?cursor=abc');

    expect(query).toEqual({ cursor: 'abc' });
  });

  it('copes with a relative link', () => {
    expect(nextPageQuery('/api/v1/products?cursor=abc')).toEqual({ cursor: 'abc' });
  });
});
