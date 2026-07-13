/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register'

// iOS standalone PWAs resume from memory and rarely re-check sw.js on their
// own, so a deployed update never lands (the delete/re-add-to-Home-Screen
// failure). Re-check on every return to foreground plus hourly; in autoUpdate
// mode the new SW takes over and reloads the page automatically.
// Standard: ~/.claude/rules/tools/mobile-pwa.md
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update()
    })
    setInterval(() => registration.update(), 60 * 60 * 1000)
  },
})
