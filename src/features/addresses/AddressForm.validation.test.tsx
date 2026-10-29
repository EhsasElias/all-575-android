import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fillNationalAddress, renderAddresses, waitForAddressLookup } from './addressTestHarness';
import { homeAddress } from './testData';

vi.mock('./LeafletMap', async () => {
  const { FakePinMap } = await import('./testMap');
  return { LeafletMap: FakePinMap };
});

function postedAddresses(api: Awaited<ReturnType<typeof renderAddresses>>['api']) {
  return api.requests().filter((request) => request === 'POST /addresses');
}

describe('Address form validation (English)', () => {
  it('shows every missing field and the missing pin, focuses the first problem, and sends nothing', async () => {
    const user = userEvent.setup();
    const { api } = await renderAddresses();
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    expect(screen.getByLabelText('Region')).toHaveFocus();
    expect(screen.getByLabelText('Region')).toHaveAccessibleDescription('This field is required');
    expect(screen.getByLabelText('Building number')).toBeInvalid();
    expect(screen.getByText('Place the pin on the map')).toBeVisible();
    expect(screen.getAllByText('This field is required')).toHaveLength(7);
    expect(
      screen.getByText('Check the fields marked with an error, then try again.'),
    ).toBeVisible();
    expect(postedAddresses(api)).toEqual([]);
  });

  it('explains each SPL rule in its own words', async () => {
    const user = userEvent.setup();
    const { api } = await renderAddresses();
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await fillNationalAddress(user);
    await user.clear(screen.getByLabelText('Recipient mobile number'));
    await user.type(screen.getByLabelText('Recipient mobile number'), '0412345678');
    await user.clear(screen.getByLabelText('Building number'));
    await user.type(screen.getByLabelText('Building number'), '12');
    await user.clear(screen.getByLabelText('Additional number'));
    await user.type(screen.getByLabelText('Additional number'), 'abcd');
    await user.clear(screen.getByLabelText('Postal code'));
    await user.type(screen.getByLabelText('Postal code'), '123456');
    await user.type(screen.getByLabelText('Short address (optional)'), 'RR2929');
    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    expect(screen.getByText('Enter a valid Saudi mobile number, like 0512345678')).toBeVisible();
    expect(screen.getByText('The building number is 4 digits')).toBeVisible();
    expect(screen.getByText('The additional number is 4 digits')).toBeVisible();
    expect(screen.getByText('The postal code is 5 digits')).toBeVisible();
    expect(
      screen.getByText('The short address is 4 letters then 4 digits, like RRRD2929'),
    ).toBeVisible();
    expect(screen.getByLabelText('Recipient mobile number')).toHaveFocus();
    expect(postedAddresses(api)).toEqual([]);
  });

  it('limits the length of free text and clears a message as soon as the field is edited', async () => {
    const user = userEvent.setup();
    await renderAddresses();
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await user.type(screen.getByLabelText('Address name (optional)'), 'x'.repeat(41));
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));
    expect(screen.getByText('Use at most 40 characters')).toBeVisible();

    await user.type(screen.getByLabelText('Address name (optional)'), '{Backspace}');
    expect(screen.queryByText('Use at most 40 characters')).not.toBeInTheDocument();
  });

  it('shows the server field errors next to the inputs in our own words, never the server text', async () => {
    const user = userEvent.setup();
    await renderAddresses({
      routes: {
        'POST /addresses': {
          status: 422,
          body: {
            message: 'The building number field format is invalid.',
            errors: {
              building_number: ['The building number field format is invalid.'],
              street: ['The street field is invalid.'],
            },
          },
        },
      },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await fillNationalAddress(user);
    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    expect(await screen.findByText('The building number is 4 digits')).toBeVisible();
    expect(screen.getByLabelText('Street')).toHaveAccessibleDescription('Check this field');
    expect(screen.queryByText(/field format is invalid/)).not.toBeInTheDocument();
    // The customer can fix it and try again: nothing is stuck in a loading state.
    expect(screen.getByRole('button', { name: 'Save address' })).not.toHaveAttribute('aria-busy');
  });

  it('explains the address limit and links back to the list', async () => {
    const user = userEvent.setup();
    await renderAddresses({
      routes: {
        'POST /addresses': {
          status: 422,
          body: { message: 'You can save up to 10 addresses.', code: 'address_limit_reached' },
        },
      },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await fillNationalAddress(user);
    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'You can save up to 10 addresses. Delete one from your list first.',
    );
    expect(screen.getByRole('link', { name: 'My addresses' })).toHaveAttribute(
      'href',
      '/account/addresses',
    );
  });

  it('keeps what was typed and says so when the network fails, then succeeds on retry', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    await renderAddresses({
      routes: {
        'POST /addresses': () => {
          attempts += 1;
          return attempts === 1 ? 'offline' : { status: 201, body: { data: homeAddress } };
        },
      },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await fillNationalAddress(user);
    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    expect(
      await screen.findByText(
        'We could not save the address. Check your connection and try again.',
      ),
    ).toBeVisible();
    expect(screen.getByLabelText('Street')).toHaveValue('King Fahd Rd');

    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Address saved' })).toBeVisible();
  });
});

describe('Address form (Arabic)', () => {
  it('is right to left, and every message is in Arabic', async () => {
    const user = userEvent.setup();
    await renderAddresses({ language: 'ar' });

    expect(await screen.findByRole('heading', { level: 1, name: 'عنوان جديد' })).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(screen.queryByText('New address')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'حفظ العنوان' }));

    expect(screen.getAllByText('هذا الحقل مطلوب').length).toBeGreaterThan(0);
    expect(screen.getByText('ضع الدبوس على الخريطة')).toBeVisible();
    expect(screen.getByLabelText('المنطقة')).toHaveFocus();
    expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
  });

  it('explains the SPL rules in Arabic', async () => {
    const user = userEvent.setup();
    await renderAddresses({ language: 'ar' });
    await screen.findByRole('heading', { level: 1, name: 'عنوان جديد' });

    await user.type(screen.getByLabelText('رقم المبنى'), '12');
    await user.type(screen.getByLabelText('الرمز البريدي'), '1');
    await user.click(screen.getByRole('button', { name: 'حفظ العنوان' }));

    expect(screen.getByText('رقم المبنى يتكون من 4 أرقام')).toBeVisible();
    expect(screen.getByText('الرمز البريدي يتكون من 5 أرقام')).toBeVisible();
  });
});
