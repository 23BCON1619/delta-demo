# HireMate Admin Panel (React Version)

This is a premium admin panel built with React, Vite, and Tailwind CSS.

## Features
- **Modern UI**: Dark theme with Lucide icons and smooth animations.
- **User Management**: Add/Edit credits for users.
- **Requests**: Approve/Reject top-up requests.
- **Packages**: Create and manage billing packages.
- **Settings**: Update LLM and Payment configurations.

## How to Run Locally

1. Open your terminal in this folder (`admin-panel`).
2. Run: `npm run dev`
3. Open `http://localhost:5173` in your browser.

## How to Deploy to cPanel

1. In this folder, run: `npm run build`
2. This will create a `dist` folder.
3. Upload all files from the `dist` folder to your cPanel hosting (e.g., in a folder named `admin`).
4. That's it! No Node.js is needed on the server to host the `dist` files.

## Environment Variables
Credentials are pre-configured in the `.env` file in this directory.
