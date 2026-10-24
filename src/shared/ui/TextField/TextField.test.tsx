import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('has a visible label tied to the input', () => {
    render(<TextField label="Mobile number" />);

    const input = screen.getByLabelText('Mobile number');
    expect(input).toBeInTheDocument();
    expect(screen.getByText('Mobile number')).toBeVisible();
  });

  it('accepts typing', async () => {
    render(<TextField label="Mobile number" />);

    await userEvent.setup().type(screen.getByLabelText('Mobile number'), '0551234567');

    expect(screen.getByLabelText('Mobile number')).toHaveValue('0551234567');
  });

  it('links the error text to the input and marks it invalid', () => {
    render(<TextField label="Mobile number" error="Enter a 10-digit number" />);

    const input = screen.getByLabelText('Mobile number');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a 10-digit number');
  });

  it('links the hint too, and lists the hint before the error', () => {
    render(<TextField label="Mobile number" hint="Starts with 05" error="Too short" />);

    expect(screen.getByLabelText('Mobile number')).toHaveAccessibleDescription(
      'Starts with 05 Too short',
    );
  });

  it('is valid and has no description when there is nothing to say', () => {
    render(<TextField label="Mobile number" />);

    const input = screen.getByLabelText('Mobile number');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('keeps an error region in the page so changes are announced', () => {
    const { rerender } = render(<TextField label="Code" />);
    const region = document.querySelector('[aria-live="polite"]');
    expect(region).toBeInTheDocument();

    rerender(<TextField label="Code" error="Wrong code" />);

    expect(region).toHaveTextContent('Wrong code');
  });

  it('uses the id it is given', () => {
    render(<TextField label="Code" id="otp" />);

    expect(screen.getByLabelText('Code')).toHaveAttribute('id', 'otp');
  });
});
