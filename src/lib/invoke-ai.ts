import { supabase } from '@/integrations/supabase/client';

/** Request permission before sending wardrobe data to the configured AI providers. */
export async function invokeAI(name: string, options?: Parameters<typeof supabase.functions.invoke>[1]) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in to use AI styling.');
  const consentKey = `dripslayer-ai-consent-v1:${session.user.id}`;
  if (sessionStorage.getItem(consentKey) !== 'allowed') {
    const allowed = window.confirm('Use AI styling? Clothing photos, wardrobe details, and relevant style profile information will be sent through Lovable AI to Google Gemini to analyze clothing and generate outfit suggestions. Do not upload sensitive or personal photos. See the Privacy Policy for details. Allow for this session?');
    if (!allowed) throw new Error('AI processing canceled. You can still organize your wardrobe manually.');
    sessionStorage.setItem(consentKey, 'allowed');
  }
  const result = await supabase.functions.invoke(name, options);
  if (!result.error) return result;

  // FunctionsHttpError's message hides the status/body behind a generic error.
  // Translate known failures without exposing provider responses or billing UI
  // instructions intended for the app owner to ordinary customers.
  const response = result.error.context as Response | undefined;
  const status = response?.status;
  let message = 'AI styling could not complete. Please try again. If this continues, contact Support@streamwalkers.com.';
  if (status === 402) {
    message = 'AI styling is temporarily unavailable because the service has reached its usage limit. Please try again later or contact Support@streamwalkers.com. Your wardrobe is saved.';
  } else if (status === 429) {
    message = 'AI styling is busy. Please wait a moment before trying again.';
  } else if (status === 401 || status === 403) {
    message = 'Your styling session could not be verified. Please sign in again.';
  } else if (result.error.name === 'FunctionsFetchError' || result.error.name === 'FunctionsRelayError') {
    message = 'Could not reach AI styling. Check your connection and try again.';
  } else if (status === 400) {
    message = 'These items could not be processed. Check your selection and try again.';
  }
  return { ...result, error: new Error(message) };
}
