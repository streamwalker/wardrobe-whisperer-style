import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invokeAI } from './invoke-ai';
const mocks = vi.hoisted(() => ({ session: vi.fn(), invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: mocks.session }, functions: { invoke: mocks.invoke } } }));
beforeEach(() => { vi.resetAllMocks(); sessionStorage.clear(); mocks.session.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }); });
describe('AI data sharing consent', () => {
  it('does not send data if permission is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await expect(invokeAI('match-outfit', { body: { wardrobe: [] } })).rejects.toThrow('AI processing canceled');
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('remembers permission for the current user and session', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.invoke.mockResolvedValue({ data: {}, error: null });
    await invokeAI('match-outfit'); await invokeAI('analyze-clothing');
    expect(confirm).toHaveBeenCalledOnce(); expect(mocks.invoke).toHaveBeenCalledTimes(2);
    mocks.session.mockResolvedValue({ data: { session: { user: { id: 'u2' } } } });
    await invokeAI('match-outfit'); expect(confirm).toHaveBeenCalledTimes(2);
  });
});

describe('AI service failures', () => {
  beforeEach(() => { sessionStorage.setItem('dripslayer-ai-consent-v1:u1', 'allowed'); });
  it.each([
    [402, 'service has reached its usage limit'],
    [429, 'wait a moment'],
    [401, 'sign in again'],
    [400, 'Check your selection'],
    [500, 'AI styling could not complete'],
  ])('explains HTTP %s without exposing provider data', async (status, expected) => {
    mocks.invoke.mockResolvedValue({ data: null, error: { name: 'FunctionsHttpError', message: 'Edge Function returned a non-2xx status code', context: { status } } });
    const result = await invokeAI('match-outfit');
    expect(result.error?.message).toContain(expected);
    expect(result.data).toBeNull();
  });
  it('distinguishes a network failure', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: { name: 'FunctionsFetchError' } });
    expect((await invokeAI('match-outfit')).error?.message).toContain('Check your connection');
  });
  it('preserves a successful response', async () => {
    const response = { data: { outfits: [] }, error: null };
    mocks.invoke.mockResolvedValue(response);
    expect(await invokeAI('match-outfit')).toBe(response);
  });
});
