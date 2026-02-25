import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {VitePWA} from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest:{
        name:"Todo App",
        short_name: "Todo",
        description: "Una aplicacion de tareas simple",
        start_url: "./http://localhost:5173",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#e5339d",
        icons:[
          {
            src: '/icons/icon1.png',
            sizes: '192x192',
            type: "image/png"
          },
           {
            src: '/icons/icon5.png',
            sizes: '512x512',
            type: "image/png"
          }
        ],
        screenshots: [
          {
            src: '/screenshots/cap123.jpg',
            sizes: '1902x990',
            type: 'image/jpg',
          }
        ],
      },
      devOptions: {
        enabled: true
      },
    }),
  
  
  ],
});
