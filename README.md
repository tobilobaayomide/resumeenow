## Resumeenow

This project is a simple and modern resume maker built with React, Vite, and Tailwind CSS. Easily create, customize, and export your professional resume.

## Features
- User-friendly interface
- Customizable resume templates
- Real-time preview
- Export to PDF

## Getting Started
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```

## Asset Size Workflow
- Check image budgets (fails when files in `src/assets` or `public` exceed 300 KB):
  ```sh
  npm run assets:check
  ```
- Optimize and resize an image before committing:
  ```sh
  npm run assets:optimize -- src/assets/input.png src/assets/output.jpg 1600 72
  ```

## License
MIT
