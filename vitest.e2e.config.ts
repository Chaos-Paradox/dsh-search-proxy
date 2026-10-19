import { defineConfig } from 'vitest/config'
import { lowerServiceDecorators } from './build/decorators.ts'

export default defineConfig({
  plugins: [{ ...lowerServiceDecorators(), enforce: 'pre' }],
  test: {
    include: ['tests/searxng.e2e.ts'],
    testTimeout: 60_000,
    server: { deps: { inline: [/@deepseek-ai\//] } },
  },
})
