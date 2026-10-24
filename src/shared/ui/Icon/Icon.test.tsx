import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

describe('Icon', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Icon name="cart" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks directional icons so they mirror in right-to-left layouts', () => {
    const { container } = render(
      <>
        <Icon name="arrow-forward" />
        <Icon name="cart" />
        <Icon name="chevron-left" />
      </>,
    );

    const [arrow, cart, chevron] = [...container.querySelectorAll('svg')];
    expect(arrow?.getAttribute('class')).toContain('mirror');
    expect(cart?.getAttribute('class')).not.toContain('mirror');
    // Physical chevrons stay put: the carousel decides what each one does.
    expect(chevron?.getAttribute('class')).not.toContain('mirror');
  });

  it('uses the size it is given', () => {
    const { container } = render(<Icon name="close" size={40} />);

    expect(container.querySelector('svg')).toHaveAttribute('width', '40');
  });
});
