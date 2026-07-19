import { app, Menu, type MenuItemConstructorOptions } from 'electron'

export type AppLocale = 'en' | 'fr'

const STRINGS: Record<AppLocale, Record<string, string>> = {
  en: {
    file: 'File',
    changeFolder: 'Change Recipe Folder…',
    quit: 'Quit',
    edit: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select All',
    view: 'View',
    reload: 'Reload',
    toggleDevTools: 'Toggle Developer Tools',
    resetZoom: 'Actual Size',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    togglefullscreen: 'Toggle Full Screen',
    window: 'Window',
    minimize: 'Minimize',
    close: 'Close',
    help: 'Help',
    shortcuts: 'Keyboard Shortcuts'
  },
  fr: {
    file: 'Fichier',
    changeFolder: 'Changer de dossier de recettes…',
    quit: 'Quitter',
    edit: 'Édition',
    undo: 'Annuler',
    redo: 'Rétablir',
    cut: 'Couper',
    copy: 'Copier',
    paste: 'Coller',
    selectAll: 'Tout sélectionner',
    view: 'Affichage',
    reload: 'Recharger',
    toggleDevTools: 'Outils de développement',
    resetZoom: 'Taille réelle',
    zoomIn: 'Zoomer',
    zoomOut: 'Dézoomer',
    togglefullscreen: 'Plein écran',
    window: 'Fenêtre',
    minimize: 'Réduire',
    close: 'Fermer',
    help: 'Aide',
    shortcuts: 'Raccourcis clavier'
  }
}

let requestChangeFolder: (() => void) | null = null
let requestShortcutsOverlay: (() => void) | null = null

export function setMenuActionHandlers(handlers: {
  onChangeFolder: () => void
  onShowShortcuts: () => void
}): void {
  requestChangeFolder = handlers.onChangeFolder
  requestShortcutsOverlay = handlers.onShowShortcuts
}

export function buildApplicationMenu(locale: AppLocale = 'en'): void {
  const t = STRINGS[locale]
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: t.file,
      submenu: [
        {
          label: t.changeFolder,
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => requestChangeFolder?.()
        },
        ...(isMac ? [] : [{ type: 'separator' as const }, { role: 'quit' as const, label: t.quit }])
      ]
    },
    {
      label: t.edit,
      submenu: [
        { role: 'undo', label: t.undo },
        { role: 'redo', label: t.redo },
        { type: 'separator' },
        { role: 'cut', label: t.cut },
        { role: 'copy', label: t.copy },
        { role: 'paste', label: t.paste },
        { role: 'selectAll', label: t.selectAll }
      ]
    },
    {
      label: t.view,
      submenu: [
        { role: 'reload', label: t.reload },
        { role: 'toggleDevTools', label: t.toggleDevTools },
        { type: 'separator' },
        { role: 'resetZoom', label: t.resetZoom },
        { role: 'zoomIn', label: t.zoomIn },
        { role: 'zoomOut', label: t.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: t.togglefullscreen }
      ]
    },
    {
      label: t.window,
      submenu: [
        { role: 'minimize', label: t.minimize },
        { role: 'close', label: t.close }
      ]
    },
    {
      label: t.help,
      submenu: [
        {
          label: t.shortcuts,
          accelerator: 'Shift+?',
          click: () => requestShortcutsOverlay?.()
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
