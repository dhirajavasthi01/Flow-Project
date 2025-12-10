import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'flow_project',
      remotes: {
        uivisual: `${process.env.VITE_REMOTE_PATH || 'http://localhost:5001/flow_uivisuals'}/assets/remoteEntry.js`,
      },
      shared: ['react', 'react-dom', 'react-router-dom', 'jotai', '@mui/material', '@emotion/react', '@emotion/styled', '@xyflow/react'],
    }),
    tailwindcss(),
  ],
})
