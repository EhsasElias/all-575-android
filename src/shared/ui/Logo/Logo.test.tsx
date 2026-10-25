import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it } from 'vitest';
import brandLogo from '../../../../brand/logo.svg?raw';
import faviconLogo from '../../../../public/favicon.svg?raw';
import { Logo } from './Logo';
import { LOGO_HEIGHT, LOGO_WIDTH } from './logoArt';

function pathData(svg: string): string[] {
  return [...svg.matchAll(/<path[^>]*?\sd="([^"]+)"/g)].map((match) => match[1] ?? '');
}

describe('Logo accessibility', () => {
  it('is an image named after the app', () => {
    render(<Logo />);

    expect(screen.getByRole('img', { name: 'ALL 5.75' })).toBeInTheDocument();
  });

  it('is named in the current language', async () => {
    await i18next.changeLanguage('ar');
    render(<Logo />);

    expect(screen.getByRole('img', { name: 'الكل بـ 5.75' })).toBeInTheDocument();
  });

  it('disappears from assistive technology when decorative', () => {
    const { container } = render(<Logo decorative />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    expect(svg).not.toHaveAttribute('aria-label');
  });
});

describe('Logo size', () => {
  it('uses the size as its width and keeps the artwork ratio', () => {
    const { container } = render(<Logo size={239} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '239');
    expect(svg).toHaveAttribute('height', '213');
    expect(svg).toHaveAttribute('viewBox', `0 0 ${LOGO_WIDTH} ${LOGO_HEIGHT}`);
  });

  it('is 40px wide by default', () => {
    const { container } = render(<Logo />);

    expect(container.querySelector('svg')).toHaveAttribute('width', '40');
  });

  it('passes className to the SVG', () => {
    const { container } = render(<Logo className="rounded" />);

    expect(container.querySelector('svg')).toHaveClass('rounded');
  });
});

describe('Logo artwork', () => {
  it('draws exactly the paths of brand/logo.svg, unchanged', () => {
    const { container } = render(<Logo />);

    const rendered = [...container.querySelectorAll('path')].map((path) => path.getAttribute('d'));
    const source = pathData(brandLogo);
    expect(source).toHaveLength(14);
    expect(rendered).toEqual(source);
  });

  it('keeps the favicon identical to the brand logo', () => {
    expect(faviconLogo).toBe(brandLogo);
  });

  it('gives every instance its own gradient and clip path ids', () => {
    const { container } = render(
      <>
        <Logo />
        <Logo />
        <Logo />
      </>,
    );

    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    expect(ids.every((id) => /^[A-Za-z][A-Za-z0-9_-]*$/.test(id))).toBe(true);
  });

  it('points the gradient fill and the clip path at ids that exist', () => {
    const { container } = render(<Logo />);

    const references = [...container.querySelectorAll('*')]
      .flatMap((element) => [element.getAttribute('fill'), element.getAttribute('clip-path')])
      .filter((value): value is string => value?.startsWith('url(#') ?? false);
    expect(references).toHaveLength(2);
    for (const reference of references) {
      const id = /url\(#(.+)\)/.exec(reference)?.[1];
      expect(id).toBeDefined();
      expect(container.querySelector(`[id="${id}"]`)).not.toBeNull();
    }
  });
});
