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
