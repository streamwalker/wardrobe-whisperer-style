import { describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({ setAccount: vi.fn(), selectOutfit: vi.fn(), clearOutfit: vi.fn() }));
vi.mock('@capacitor/core', () => ({ registerPlugin: () => native }));
vi.mock('./platform', () => ({ isIOSApp: () => true }));
import { clearVoiceOutfit, selectVoiceOutfit, setVoiceAccount, spokenOutfit } from './outfit-voice';

describe('explicit Siri outfit selection', () => {
  it('speaks clothing names without including other profile data', () => {
    expect(spokenOutfit('Weekend', ['Blue shirt', '', 'Jeans'])).toBe('Your selected outfit is Weekend. Wear Blue shirt, Jeans.');
  });
  it('bounds long user content below the native storage limit', () => {
    const text = spokenOutfit('x'.repeat(500), Array(20).fill('y'.repeat(500)));
    expect(text.length).toBeLessThan(1500);
    expect(spokenOutfit('Night\nlook', [])).toBe('Your selected outfit is Night look.');
  });
  it('identifies the current account before storing a user-selected outfit', async () => {
    await selectVoiceOutfit('test-account', 'Weekend', ['Jeans']);
    expect(native.setAccount).toHaveBeenCalledWith({ account: 'test-account' });
    expect(native.selectOutfit).toHaveBeenCalledWith({ account: 'test-account', text: 'Your selected outfit is Weekend. Wear Jeans.' });
    expect(native.setAccount.mock.invocationCallOrder[0]).toBeLessThan(native.selectOutfit.mock.invocationCallOrder[0]);
  });
  it('supports clearing the selection and signed-out state', async () => {
    await clearVoiceOutfit();
    await setVoiceAccount(null);
    expect(native.clearOutfit).toHaveBeenCalled();
    expect(native.setAccount).toHaveBeenLastCalledWith({ account: null });
  });
});
