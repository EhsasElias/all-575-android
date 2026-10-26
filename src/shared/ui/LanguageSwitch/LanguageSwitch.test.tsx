import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { LanguageSwitch } from './LanguageSwitch';

describe('LanguageSwitch', () => {
  it('is a radio group with one radio per language', () => {
    render(<LanguageSwitch value="en" onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /AR/ })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /FR/ })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /EN/ })).toBeChecked();
  });

  it('always shows EN, FR, then AR on the right, in every UI language', async () => {
    const { rerender } = render(<LanguageSwitch value="en" onChange={vi.fn()} />);
    const names = () => screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'));
    expect(screen.getByRole('group', { name: 'Language' })).toHaveAttribute('dir', 'ltr');
    expect(names()).toEqual(['en', 'fr', 'ar']);

    await i18next.changeLanguage('ar');
    rerender(<LanguageSwitch value="ar" onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'اللغة' })).toHaveAttribute('dir', 'ltr');
    expect(names()).toEqual(['en', 'fr', 'ar']);
  });

  it('names each option in its own language for screen readers', () => {
    render(<LanguageSwitch value="en" onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'AR العربية' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'EN English' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'FR Français' })).toBeInTheDocument();
  });

  it('reports the chosen language on click', async () => {
    const onChange = vi.fn();
    render(<LanguageSwitch value="en" onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('radio', { name: /AR/ }));

    expect(onChange).toHaveBeenCalledWith('ar');
  });

  it('reports French when it is chosen', async () => {
    const onChange = vi.fn();
    render(<LanguageSwitch value="en" onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('radio', { name: /FR/ }));

    expect(onChange).toHaveBeenCalledWith('fr');
  });

  it('does not report the language that is already selected', async () => {
    const onChange = vi.fn();
    render(<LanguageSwitch value="en" onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('radio', { name: /EN/ }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('works with the arrow keys', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<LanguageSwitch value="en" onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('radio', { name: /EN/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}');

    expect(onChange).toHaveBeenCalledWith('fr');
  });

  it('shows the selection that the parent controls', () => {
    const { rerender } = render(<LanguageSwitch value="ar" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /AR/ })).toBeChecked();

    rerender(<LanguageSwitch value="en" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /EN/ })).toBeChecked();
  });
});
