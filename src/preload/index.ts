import { contextBridge } from 'electron'
import { exposeElectronTRPC } from 'electron-trpc/main'
import { electronAPI } from '@electron-toolkit/preload'

process.once('loaded', () => {
  exposeElectronTRPC()
})

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
}
