import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Icon } from '../Icon/Icon';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('gets its accessible name from the label, not from the icon', () => {
    render(
      <IconButton label="Close">
        <Icon name="close" />
      </IconButton>,
    );

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('calls onClick from mouse and keyboard', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <IconButton label="Pause" onClick={onClick}>
        <Icon name="pause" />
      </IconButton>,
    );

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
