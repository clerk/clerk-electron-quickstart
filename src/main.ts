import { createClerkBridge } from '@clerk/electron'
import { storage } from '@clerk/electron/storage'
import { app, BrowserWindow, net, protocol, session, shell } from 'electron'
import started from 'electron-squirrel-startup'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

const RENDERER_SCHEME = 'clerk-electron-quickstart'
const RENDERER_HOST = 'app'

// `new URL(...).origin` is the string 'null' for a non-special scheme like
// clerk-electron-quickstart://, so compare on the scheme and host instead.
const originOf = (url: string) => {
  const parsed = new URL(url)
  return `${parsed.protocol}//${parsed.host}`
}

const FAPI_HOST = import.meta.env.VITE_CLERK_FRONTEND_API_HOST

if (!FAPI_HOST) {
  throw new Error('Add VITE_CLERK_FRONTEND_API_HOST to the .env file')
}

// Registers Clerk's IPC handlers and token storage. Call it before app.whenReady().
const clerk = createClerkBridge({
  storage: storage(),
  // Serves the renderer from clerk-electron-quickstart://app so OAuth deep links
  // can return to the app. Also registers the scheme as privileged.
  renderer: { scheme: RENDERER_SCHEME, host: RENDERER_HOST },
})

const rendererRoot = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}`)

// Packaged builds: serve the Vite output from the custom scheme instead of file://.
const registerRendererProtocol = () => {
  protocol.handle(RENDERER_SCHEME, async (request) => {
    const url = new URL(request.url)
    if (url.host !== RENDERER_HOST) {
      return new Response('Not found', { status: 404 })
    }
    let requestedPath: string
    try {
      requestedPath = decodeURIComponent(url.pathname)
    } catch {
      return new Response('Bad request', { status: 400 })
    }
    const resolvedPath = path.resolve(rendererRoot, `.${requestedPath}`)
    const relativePath = path.relative(rendererRoot, resolvedPath)
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return new Response('Forbidden', { status: 403 })
    }
    const hasExtension = /\.[^/]+$/.test(url.pathname)
    const filePath = hasExtension ? resolvedPath : path.join(rendererRoot, 'index.html')
    return net.fetch(pathToFileURL(filePath).toString())
  })
}

// Packaged builds: the CSP comes from a response header on the renderer's own origin,
// without the dev-server allowances the index.html meta tag carries.
const applyContentSecurityPolicy = () => {
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: [`${RENDERER_SCHEME}://${RENDERER_HOST}/*`] },
    (details, callback) => {
      if (details.resourceType !== 'mainFrame') {
        callback({ responseHeaders: details.responseHeaders })
        return
      }
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' https://${FAPI_HOST} https://challenges.cloudflare.com https://*.protect.clerk.com`,
              `connect-src 'self' https://${FAPI_HOST} https://*.protect.clerk.com:* https://clerk-telemetry.com https://*.clerk-telemetry.com`,
              "img-src 'self' https://img.clerk.com data:",
              "style-src 'self' 'unsafe-inline'",
              "worker-src 'self' blob:",
              "frame-src 'self' https://challenges.cloudflare.com https://*.protect.clerk.com",
              "form-action 'self'",
            ].join('; '),
          ],
        },
      })
    },
  )
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Keep the Clerk bridge inside this app: navigation to another origin, including a
  // server-side redirect to one, would carry the preload (and the token cache) to a
  // page you do not control.
  const allowedOrigins = new Set(
    [MAIN_WINDOW_VITE_DEV_SERVER_URL, `${RENDERER_SCHEME}://${RENDERER_HOST}`]
      .filter((value): value is string => Boolean(value))
      .map(originOf),
  )

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!allowedOrigins.has(originOf(url))) {
      event.preventDefault()
      if (url.startsWith('https://') || url.startsWith('http://')) {
        void shell.openExternal(url)
      }
    }
  })

  mainWindow.webContents.on('will-redirect', (event, url) => {
    if (event.isMainFrame && !allowedOrigins.has(originOf(url))) {
      event.preventDefault()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadURL(`${RENDERER_SCHEME}://${RENDERER_HOST}/`)
  }
}

// On Windows and Linux, Clerk forwards OAuth deep links through Electron's
// single-instance lock. Skip the bootstrap in the process that is quitting.
if (clerk.isPrimaryInstance) {
  app.on('ready', () => {
    if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      registerRendererProtocol()
      applyContentSecurityPolicy()
    }
    createWindow()
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  clerk.cleanup()
})
