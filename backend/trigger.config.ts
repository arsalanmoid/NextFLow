import { defineConfig } from '@trigger.dev/sdk/v3'

export default defineConfig({
  project: 'proj_voppvbefrhyamgbpkzrp',
  dirs: ['src/trigger'],
  maxDuration: 300,
  retries: {
    default: {
      maxAttempts: 2,
    },
  },
})
