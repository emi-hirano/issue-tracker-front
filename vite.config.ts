/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,          // describe/it/expect を import なしで使える
    environment: 'jsdom',   // ブラウザDOMをNode上で再現
    setupFiles: './src/test/setup.ts', // jest-domのマッチャを読み込む
  },
})