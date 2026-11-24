import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Outfits from './Outfits';
const mocks = vi.hoisted(() => ({ verify: vi.fn(), exportPdf: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'account-a' }, loading: false }) }));
vi.mock('@/hooks/useSubscription', () => ({ useSubscription: () => ({ refetch: mocks.verify }) }));
vi.mock('@/hooks/useWardrobeItems', () => ({ useWardrobeItems: () => ({ items: [{ id: 'shirt', name: 'Blue shirt', color_hex: '#0000ff' }] }) }));
vi.mock('@/hooks/useOnboarding', () => ({ useOnboarding: () => ({}) }));
vi.mock('@/components/onboarding/OnboardingTour', () => ({ default: () => null }));
vi.mock('@/components/wardrobe/OutfitSuggestionDrawer', () => ({ default: () => null }));
vi.mock('@/lib/export-outfits-pdf', () => ({ exportOutfitsPdf: mocks.exportPdf }));
vi.mock('@/lib/platform', () => ({ isIOSApp: () => false }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [{ id: 'outfit', name: 'Office', item_ids: ['shirt'], mood: null, explanation: null, is_favorite: false }], isLoading: false }),
  useMutation: () => ({ mutate: vi.fn() }), useQueryClient: () => ({}),
}));
vi.mock('sonner', () => ({ toast: { error: mocks.error, info: mocks.info, success: vi.fn() } }));
function mount() { render(<MemoryRouter><Routes><Route path="/" element={<Outfits />} /><Route path="/pricing" element={<p>Plan choices</p>} /></Routes></MemoryRouter>); }
beforeEach(() => { vi.resetAllMocks(); mocks.exportPdf.mockResolvedValue(undefined); });
afterEach(cleanup);
it('keeps the user on their outfits when Pro verification fails', async () => {
  mocks.verify.mockResolvedValue({ error: new Error('unavailable'), data: { subscribed: true } });
  mount(); fireEvent.click(screen.getByRole('button', { name: 'EXPORT PDF' }));
  await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Could not verify Pro access. Please try again.'));
  expect(mocks.exportPdf).not.toHaveBeenCalled();
  expect(screen.queryByText('Plan choices')).not.toBeInTheDocument();
});
it('opens plan choices for a verified free user without exporting', async () => {
  mocks.verify.mockResolvedValue({ data: { subscribed: false } });
  mount(); fireEvent.click(screen.getByRole('button', { name: 'EXPORT PDF' }));
  expect(await screen.findByText('Plan choices')).toBeInTheDocument();
  expect(mocks.exportPdf).not.toHaveBeenCalled();
});
it('exports the saved outfit after verified Pro access', async () => {
  mocks.verify.mockResolvedValue({ data: { subscribed: true } });
  mount(); fireEvent.click(screen.getByRole('button', { name: 'EXPORT PDF' }));
  await waitFor(() => expect(mocks.exportPdf).toHaveBeenCalledWith([expect.objectContaining({ name: 'Office', items: [expect.objectContaining({ name: 'Blue shirt' })] })]));
});
