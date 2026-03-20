import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'pdfjs';
          }

          if (id.includes('node_modules/unpdf')) {
            return 'unpdf';
          }

          if (id.includes('node_modules/mammoth')) {
            return 'mammoth';
          }

          if (
            id.includes('node_modules/jszip') ||
            id.includes('node_modules/underscore') ||
            id.includes('node_modules/xmlbuilder') ||
            id.includes('node_modules/@xmldom') ||
            id.includes('node_modules/bluebird') ||
            id.includes('node_modules/base64-js') ||
            id.includes('node_modules/dingbat-to-unicode') ||
            id.includes('node_modules/lop') ||
            id.includes('node_modules/path-is-absolute')
          ) {
            return 'docx-vendor';
          }

          if (id.includes('/src/lib/resume-parser/') || id.includes('/src/lib/resumeParser.ts')) {
            return 'resume-parser';
          }

          if (
            id.includes('/src/components/builder/preview/') ||
            id.includes('/src/components/builder/templates/') ||
            id.includes('/src/components/dashboard/shared/ScaledResumePreview.tsx') ||
            id.includes('/src/domain/resume/') ||
            id.includes('/src/domain/templates/')
          ) {
            return 'resume-preview';
          }

          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }

          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }

          return undefined;
        },
      },
    },
  },
});
