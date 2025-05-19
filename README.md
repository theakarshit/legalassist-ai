# LegalAssist AI - Deployment Guide

## Overview

LegalAssist AI is a web application that helps users analyze legal documents using AI. The application consists of:

1. **Backend**: A Flask API that handles document processing and OpenAI integration
2. **Frontend**: A React SPA with TailwindCSS for the user interface

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- OpenAI API key (already configured in the backend)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```
   python -m src.main
   ```
   The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or if using pnpm:
   ```
   pnpm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   or if using pnpm:
   ```
   pnpm run dev
   ```
   The frontend will run on http://localhost:5173

## Replit Deployment

### Backend Deployment

1. Create a new Replit using the Python template
2. Upload the backend directory contents
3. Install dependencies using the requirements.txt file
4. Set the run command to `python -m src.main`

### Frontend Deployment

1. Create a new Replit using the Node.js template
2. Upload the frontend directory contents
3. Install dependencies using `npm install` or `pnpm install`
4. Set the run command to `npm run dev` or `pnpm run dev`
5. Update the API endpoint in the frontend code to point to your deployed backend URL

## Features

- Upload PDF and DOCX legal documents
- Get 5 AI-suggested questions based on document content
- Ask custom questions about the document
- View highlighted relevant document segments
- Track token usage for each interaction

## API Endpoints

- `POST /api/upload`: Upload a document and get suggested questions
- `POST /api/ask`: Ask a question about an uploaded document
- `GET /api/health`: Health check endpoint

## Security Notes

- The OpenAI API key is included in the backend code for demonstration purposes
- In a production environment, this should be stored as an environment variable
