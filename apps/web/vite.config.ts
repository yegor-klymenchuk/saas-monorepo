import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, loadEnv } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

const config = defineConfig(({ mode }) => {
  const buildEnv = loadEnv(mode, process.cwd(), '')
  const canUploadSourceMaps = Boolean(buildEnv.SENTRY_ORG && buildEnv.SENTRY_PROJECT && buildEnv.SENTRY_AUTH_TOKEN)

  return {
    plugins: [
      devtools(),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
      nitro({
        preset: 'node-server',
        compatibilityDate: '2026-07-18',
        // Include the preloaded SDK and its dependencies in standalone deployments
        traceDeps: ['@sentry/tanstackstart-react', 'dotenv', 'zod'],
      }),
      sentryTanstackStart({
        org: buildEnv.SENTRY_ORG,
        project: buildEnv.SENTRY_PROJECT,
        authToken: buildEnv.SENTRY_AUTH_TOKEN,
        telemetry: false,
        release: { create: canUploadSourceMaps, finalize: canUploadSourceMaps },
        sourcemaps: {
          disable: !canUploadSourceMaps,
        },
      }),
    ],
  }
})

export default config
