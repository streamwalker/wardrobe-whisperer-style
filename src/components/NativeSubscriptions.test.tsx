import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import NativeSubscriptions from './NativeSubscriptions';
const mocks = vi.hoisted(() => ({
  auth: { user: { id: 'account-a' } as { id: string } | null },
  state: { isPro: false, isLoading: false, isUnavailable: false, refetch: vi.fn() },
  identify: vi.fn(), offerings: vi.fn(), purchase: vi.fn(), restore: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/hooks/useSubscription', () => ({ useSubscription: () => mocks.state }));
vi.mock('@/lib/native-purchases', () => ({ identifyPurchaser: mocks.identify, Purchases: {
  getOfferings: mocks.offerings, purchasePackage: mocks.purchase, restorePurchases: mocks.restore,
} }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error, info: mocks.info } }));
const pkg = { identifier: 'monthly', packageType: 'MONTHLY', product: { title: 'Monthly Pro', priceString: '€5.49' } };
function mount() { return render(<MemoryRouter><NativeSubscriptions /></MemoryRouter>); }
beforeEach(() => {
  vi.resetAllMocks(); mocks.auth.user = { id: 'account-a' };
  Object.assign(mocks.state, { isPro: false, isLoading: false, isUnavailable: false });
  mocks.identify.mockResolvedValue(undefined);
  mocks.offerings.mockResolvedValue({ current: { availablePackages: [pkg] } });
});
afterEach(cleanup);
it('blocks new purchases while verification is unavailable but permits restore', async () => {
  mocks.state.isUnavailable = true;
  mount();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Restore Purchases' })).toBeEnabled());
  expect(screen.queryByRole('button', { name: /Monthly Pro/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry subscription check' })).toBeInTheDocument();
});
it('shows active access instead of selling an existing subscriber another plan', async () => {
  mocks.state.isPro = true;
  mount();
  expect(await screen.findByText('Your Pro subscription is active.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Monthly Pro/ })).not.toBeInTheDocument();
});
it('recovers from a failed offerings request without retaining its error', async () => {
  mocks.offerings.mockRejectedValueOnce(new Error('Plans unavailable'));
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Retry loading plans' }));
  expect(await screen.findByRole('button', { name: /Monthly Pro/ })).toBeInTheDocument();
  expect(screen.queryByText('Plans unavailable')).not.toBeInTheDocument();
});
it('does not report Pro ready when server verification fails after purchase', async () => {
  mocks.purchase.mockResolvedValue({ customerInfo: { entitlements: { active: { pro: {} } } } });
  mocks.state.refetch.mockResolvedValue({ error: new Error('offline'), data: { subscribed: true } });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /Monthly Pro/ }));
  await waitFor(() => expect(mocks.error).toHaveBeenCalled());
  expect(mocks.success).not.toHaveBeenCalled();
});
it('ignores a purchase response after the Drip Slayer account changes', async () => {
  let finish!: (v: unknown) => void;
  mocks.purchase.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const view = mount();
  fireEvent.click(await screen.findByRole('button', { name: /Monthly Pro/ }));
  await waitFor(() => expect(mocks.purchase).toHaveBeenCalled());
  mocks.auth.user = { id: 'account-b' };
  view.rerender(<MemoryRouter><NativeSubscriptions /></MemoryRouter>);
  finish({ customerInfo: { entitlements: { active: { pro: {} } } } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Restore Purchases' })).toBeEnabled());
  expect(mocks.state.refetch).not.toHaveBeenCalled();
  expect(mocks.success).not.toHaveBeenCalled();
});

it('uses localized StoreKit prices and verifies access after purchase', async () => {
  mocks.purchase.mockResolvedValue({ customerInfo: { entitlements: { active: { pro: {} } } } });
  mocks.state.refetch.mockResolvedValue({ data: { subscribed: true } });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /€5.49 \/ month/ }));
  await waitFor(() => expect(mocks.purchase).toHaveBeenCalledWith({ aPackage: pkg }));
  expect(mocks.identify).toHaveBeenCalledWith('account-a');
  await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Pro is ready to use.'));
});
it('does not grant Pro when a purchase is pending', async () => {
  mocks.purchase.mockResolvedValue({ customerInfo: { entitlements: { active: {} } } });
  mount(); fireEvent.click(await screen.findByRole('button', { name: /€5.49/ }));
  await waitFor(() => expect(mocks.info).toHaveBeenCalledWith('Your purchase is pending approval.'));
  expect(mocks.state.refetch).not.toHaveBeenCalled(); expect(mocks.success).not.toHaveBeenCalled();
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
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Subscriptions are not available yet'));
  expect(screen.queryByText('$4.99')).toBeNull();
});
