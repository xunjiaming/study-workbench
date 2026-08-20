export interface PwaInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}
let deferredPrompt: PwaInstallPromptEvent | null = null
const listeners = new Set<(p: PwaInstallPromptEvent | null) => void>()
export function trackInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as PwaInstallPromptEvent
    listeners.forEach((l) => l(deferredPrompt))
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((l) => l(null))
  })
}
export function getDeferredPrompt(): PwaInstallPromptEvent | null { return deferredPrompt }
export function subscribeInstallPrompt(listener: (p: PwaInstallPromptEvent | null) => void): () => void {
  listeners.add(listener); listener(deferredPrompt); return () => { listeners.delete(listener) }
}
export function consumeInstallPrompt(): PwaInstallPromptEvent | null {
  const p = deferredPrompt; deferredPrompt = null; listeners.forEach((l)=>l(null)); return p
}
