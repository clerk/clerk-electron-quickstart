<p align="center">
  <a href="https://clerk.com?utm_source=github&utm_medium=owned" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://images.clerk.com/static/logo-dark-mode-400x400.png">
      <img alt="Clerk Logo for light background" src="https://images.clerk.com/static/logo-light-mode-400x400.png" height="64">
    </picture>
  </a>
  <br />
</p>
<div align="center">
  <h1>
    Clerk and Electron Quickstart 
  </h1>  
  <a href="https://www.npmjs.com/package/@clerk/electron">
    <img alt="Downloads" src="https://img.shields.io/npm/dm/@clerk/electron" />
  </a>
  <a href="https://clerk.com/discord">
    <img alt="Discord" src="https://img.shields.io/discord/856971667393609759?color=7389D8&label&logo=discord&logoColor=ffffff" />
  </a>
  <a href="https://x.com/clerk">
    <img alt="Follow on X" src="https://img.shields.io/twitter/url.svg?label=%40clerk&style=social&url=https%3A%2F%2Fx.com%2Fclerk" />
  </a> 
  <br />
  <br />
</div>

## Introduction

Clerk is a developer-first authentication and user management solution. This repository is the finished state of the [Electron quickstart](https://clerk.com/docs/electron/getting-started/quickstart), plus the configuration from the [OAuth deep links](https://clerk.com/docs/guides/configure/auth-strategies/oauth-deep-links) and [deployment](https://clerk.com/docs/guides/development/deployment/electron) guides.

After following the quickstart you'll have learned how to:

- Scaffold an Electron app with Electron Forge and React
- Install `@clerk/electron` and `electron-store`
- Set your Publishable Key
- Set up Clerk in the main process, preload script, and renderer
- Add a Content Security Policy that allows Clerk's UI to load
- Sign up and sign in with email and password

The extra configuration in this repo (not part of the quickstart):

- `renderer` scheme registration and `protocol.handle` in `src/main.ts` so OAuth and SSO return to the app through a deep link
- `packagerConfig.protocols` and the Linux `mimeType` entries in `forge.config.ts`
- `applyContentSecurityPolicy` in `src/main.ts`: the packaged app gets its Content Security Policy from a response header on the custom-scheme origin, without the dev server's `'unsafe-eval'` and localhost allowances that the `index.html` meta tag carries
- A navigation guard in `createWindow()` (`will-navigate` and `setWindowOpenHandler`) that keeps the window on the renderer's own origin and opens other links in the system browser, so a remote page can never inherit the preload script and Clerk's token cache

## Running the app

1. `npm install`
2. Copy `.env.example` to `.env` and set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CLERK_FRONTEND_API_HOST` from the API keys page in the Clerk Dashboard
3. Enable the Native API on the **Native applications** page in the Clerk Dashboard
4. Allow the dev server origin on your instance: run the `curl -X PATCH https://api.clerk.com/v1/instance …` command from the quickstart's [Allow your app's origin](https://clerk.com/docs/electron/getting-started/quickstart#allow-your-apps-origin) step with `http://localhost:5173`
5. `npm start`

OAuth needs a packaged build and two more Dashboard/API settings: add `clerk-electron-quickstart://app` to `allowed_origins` and `clerk-electron-quickstart://app/` to the mobile SSO redirect allowlist, as the [OAuth deep links guide](https://clerk.com/docs/guides/configure/auth-strategies/oauth-deep-links) shows; then `npm run package` and launch the app from `out/`.

## Learn more

- [Clerk Electron SDK reference](https://clerk.com/docs/reference/electron/overview)
- [Clerk Docs](https://clerk.com/docs)
