import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setVoiceAccount } from '@/lib/outfit-voice';

export default function VoiceAccountSync() {
  useEffect(() => {
    // INITIAL_SESSION covers a signed-out launch. A different account clears
    // the previous person's selection; token refresh preserves it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void setVoiceAccount(session?.user.id ?? null).catch(() => {
        console.warn('Siri outfit selection could not be synchronized.');
      });
    });
    return () => subscription.unsubscribe();
  }, []);
  return null;
}
