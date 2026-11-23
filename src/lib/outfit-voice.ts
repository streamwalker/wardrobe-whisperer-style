import { registerPlugin } from '@capacitor/core';
import { isIOSApp } from './platform';

const voice = registerPlugin<{
  setAccount(options: { account: string | null }): Promise<void>;
  selectOutfit(options: { account: string; text: string }): Promise<void>;
  clearOutfit(): Promise<void>;
}>('OutfitVoice');

export async function setVoiceAccount(account: string | null) {
  if (isIOSApp()) await voice.setAccount({ account });
}

export function spokenOutfit(name: string, items: string[]) {
  const clean = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 100);
  const clothing = items.map(clean).filter(Boolean).slice(0, 10);
  return `Your selected outfit is ${clean(name)}.${clothing.length ? ` Wear ${clothing.join(', ')}.` : ''}`;
}

export async function selectVoiceOutfit(account: string, name: string, items: string[]) {
  await setVoiceAccount(account);
  await voice.selectOutfit({ account, text: spokenOutfit(name, items) });
}

export async function clearVoiceOutfit() {
  if (isIOSApp()) await voice.clearOutfit();
}
