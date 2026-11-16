import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NativeSubscriptions from './NativeSubscriptions';
const mocks = vi.hoisted(() => ({
  identify: vi.fn(), offerings: vi.fn(), purchase: vi.fn(), restore: vi.fn(), refetch: vi.fn(),
  success: vi.fn(), info: vi.fn(), error: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user-123' } }) }));
vi.mock('@/hooks/useSubscription', () => ({ useSubscription: () => ({ refetch: mocks.refetch }) }));
vi.mock('@/lib/native-purchases', () => ({ identifyPurchaser: mocks.identify, Purchases: { getOfferings: mocks.offerings, purchasePackage: mocks.purchase, restorePurchases: mocks.restore } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, info: mocks.info, error: mocks.error } }));
const pkg = { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { title: 'Drip Slayer Pro Monthly', priceString: '€5.49' } };
beforeEach(() => { vi.resetAllMocks(); mocks.identify.mockResolvedValue(undefined); mocks.offerings.mockResolvedValue({ current: { availablePackages: [pkg] } }); });
afterEach(cleanup);
const mount = () => render(<MemoryRouter><NativeSubscriptions /></MemoryRouter>);
describe('Apple subscriptions', () => {
  it('uses localized StoreKit prices and verifies access after purchase', async () => {
    mocks.purchase.mockResolvedValue({ customerInfo: { entitlements: { active: { pro: {} } } } });
    mocks.refetch.mockResolvedValue({ data: { subscribed: true } });
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /€5.49 \/ month/ }));
    await waitFor(() => expect(mocks.purchase).toHaveBeenCalledWith({ aPackage: pkg }));
    expect(mocks.identify).toHaveBeenCalledWith('user-123');
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Pro is ready to use.'));
  });
  it('does not grant Pro when a purchase is pending', async () => {
    mocks.purchase.mockResolvedValue({ customerInfo: { entitlements: { active: {} } } });
    mount(); fireEvent.click(await screen.findByRole('button', { name: /€5.49/ }));
    await waitFor(() => expect(mocks.info).toHaveBeenCalledWith('Your purchase is pending approval.'));
    expect(mocks.refetch).not.toHaveBeenCalled(); expect(mocks.success).not.toHaveBeenCalled();
  });
  it('restores through Apple without starting another purchase', async () => {
    mocks.restore.mockResolvedValue({ customerInfo: { entitlements: { active: {} } } });
    mount(); await screen.findByRole('button', { name: /€5.49/ });
    fireEvent.click(screen.getByRole('button', { name: 'Restore Purchases' }));
    await waitFor(() => expect(mocks.restore).toHaveBeenCalledOnce());
    expect(mocks.purchase).not.toHaveBeenCalled();
    await waitFor(() => expect(mocks.info).toHaveBeenCalledWith('No active Pro subscription was found for this Apple account.'));
  });
  it('shows an unavailable state when products are not configured', async () => {
    mocks.offerings.mockResolvedValue({ current: null }); mount();
    expect(await screen.findByRole('status')).toHaveTextContent('Subscriptions are not available yet');
    expect(screen.queryByText('$4.99')).toBeNull();
  });
});
