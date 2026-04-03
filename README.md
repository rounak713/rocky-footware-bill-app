# Footwear Billing System Starter

This is the starter repository for the Footwear Retail Billing & Accounting System scoped in the architectural blueprint. It contains a scaffolding setup for a Node.js/Express backend and a Vite/React frontend.

## Important Note regarding Node/npm

Currently, this system does not have `node` or `npm` automatically installed. To run this project locally, please ensure you execute this on a system with Node.js installed, or install Node.js via Homebrew/NVM.

## Architecture

- **Backend:** Located in `backend/`. Uses Express.js. Designed to link to a PostgreSQL database for financial integrity.
- **Frontend:** Located in `frontend/`. Built with Vite, React, and Tailwind CSS. Modern PWA optimized for modern UI features.

## How to Run Locally

### 1. Requirements
- Node.js (v18+)
- PostgreSQL installed and running locally.

### 2. Run the Backend
```bash
cd backend
npm install
npm start
```
*The backend server will run on http://localhost:5000*

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
*The React local development server will spin up on http://localhost:5173*

## Next Steps for Development
Review the `backend/src/server.js` file placeholder for the billing engine APIs.
Review the `frontend/src/pages/POSBilling.jsx` for the beautifully styled Point-of-Sale interface powered by TailwindCSS. You can start adapting the frontend immediately!
