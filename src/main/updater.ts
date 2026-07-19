import { autoUpdater } from 'electron-updater'

/**
 * electron-builder's GitHub publish already writes the latest*.yml manifest
 * (see electron-builder.yml `publish.provider: github`) that electron-updater
 * reads to compare against the running version — no separate feed config
 * needed. checkForUpdatesAndNotify() downloads silently and shows a native
 * OS notification once ready; clicking it quits and installs.
 */
export function checkForUpdates(): void {
  autoUpdater.checkForUpdatesAndNotify().catch((error: unknown) => {
    // Not fatal: no network, no published release yet, etc. — the app
    // keeps running on the current version either way.
    console.error('[updater] check failed:', error)
  })
}
