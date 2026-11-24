import { act, renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useSubscription } from './useSubscription';

const mocks = vi.hoisted(() => ({
  auth: { user: { id: 'account-a' } as { id: string } | null, loading: false },
  invoke: vi.fn(), ios: false,
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/lib/platform', () => ({ isIOSApp: () => mocks.ios }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return renderHook(() => useSubscription(), { wrapper: ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
beforeEach(() => { mocks.auth = { user: { id: 'account-a' }, loading: false }; mocks.ios = false; mocks.invoke.mockReset(); });
afterEach(() => { cleanup(); clients.splice(0).forEach(c => c.clear()); });

describe('verified subscription state', () => {
  it('does not label a pending request free', () => {
    mocks.invoke.mockReturnValue(new Promise(() => {}));
    expect(mount().result.current.status).toBe('checking');
  });
  it('shows an unavailable state on provider failure and recovers on retry', async () => {
    mocks.invoke.mockResolvedValueOnce({ error: new Error('unavailable') });
    const hook = mount();
    await waitFor(() => expect(hook.result.current.status).toBe('unavailable'));
    mocks.invoke.mockResolvedValueOnce({ data: { subscribed: true } });
    await act(async () => { await hook.result.current.refetch(); });
    await waitFor(() => expect(hook.result.current.status).toBe('pro'));
  });
  it('rejects malformed responses instead of treating them as free', async () => {
    mocks.invoke.mockResolvedValue({ data: { subscribed: 'false' } });
    const hook = mount();
    await waitFor(() => expect(hook.result.current.status).toBe('unavailable'));
  });
  it('labels free only after a verified negative response', async () => {
    mocks.invoke.mockResolvedValue({ data: { subscribed: false } });
    const hook = mount();
    await waitFor(() => expect(hook.result.current.status).toBe('free'));
  });
  it('does not reuse the previous account entitlement after switching accounts', async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { subscribed: true } });
    const hook = mount();
    await waitFor(() => expect(hook.result.current.isPro).toBe(true));
    mocks.auth.user = { id: 'account-b' };
    mocks.invoke.mockReturnValue(new Promise(() => {}));
    hook.rerender();
    expect(hook.result.current.status).toBe('checking');
    expect(hook.result.current.isPro).toBe(false);
  });
  it('does not expose a cached Pro result after a failed refresh', async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { subscribed: true } });
    const hook = mount();
    await waitFor(() => expect(hook.result.current.isPro).toBe(true));
    mocks.invoke.mockResolvedValueOnce({ error: new Error('offline') });
    await act(async () => { await hook.result.current.refetch(); });
    await waitFor(() => expect(hook.result.current.status).toBe('unavailable'));
    expect(hook.result.current.isPro).toBe(false);
  });
  it('does not call the backend while signed out', () => {
    mocks.auth.user = null;
    expect(mount().result.current.status).toBe('signed-out');
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('uses server Apple verification for iOS', async () => {
    mocks.ios = true;
    mocks.invoke.mockResolvedValue({ data: { subscribed: true } });
    const hook = mount();
    await waitFor(() => expect(hook.result.current.currentPlan).toBe('Apple subscription'));
    expect(mocks.invoke).toHaveBeenCalledWith('check-app-subscription');
  });
});
