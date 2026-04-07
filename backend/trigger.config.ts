import { defineConfig } from '@trigger.dev/sdk/v3'
import { aptGet } from '@trigger.dev/build/extensions/core'

export default defineConfig({
  project: 'proj_voppvbefrhyamgbpkzrp',
  dirs: ['src/trigger'],
  maxDuration: 300,
  retries: {
    default: {
      maxAttempts: 2,
    },
  },
  build: {
    extensions: [
      aptGet({ packages: ['ffmpeg'] }),
    ],
  },
})
