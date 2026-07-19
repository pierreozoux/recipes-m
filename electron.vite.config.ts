import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@shared': resolve('src/renderer/src/domain')
      }
    },
    build: {
      // electron-trpc's bundle statically imports both main- and
      // preload-only symbols from 'electron' in the same module; Node's ESM
      // loader rejects that at link time (CJS tolerates it), so main and
      // preload are built as CJS regardless of the root package.json's
      // "type": "module".
      rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } }
    }
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/renderer/src/domain')
      }
    },
    plugins: [react()]
  }
})
