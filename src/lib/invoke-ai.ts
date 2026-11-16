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
  return supabase.functions.invoke(name, options);
}
