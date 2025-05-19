# GitHub Import Instructions for LegalAssist AI

This document provides step-by-step instructions for importing the LegalAssist AI project into GitHub.

## Prerequisites
- A GitHub account
- Git installed on your local machine
- The LegalAssist AI project files

## Instructions

### 1. Create a New Repository on GitHub
1. Log in to your GitHub account
2. Click on the "+" icon in the top-right corner and select "New repository"
3. Name your repository (e.g., "legalassist-ai")
4. Add an optional description
5. Choose whether to make the repository public or private
6. Do NOT initialize the repository with a README, .gitignore, or license
7. Click "Create repository"

### 2. Configure Git on Your Local Machine
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Initialize the Local Repository
Navigate to the project directory and run:
```bash
cd legalassist-ai
git init
git add .
git commit -m "Initial commit of LegalAssist AI project"
```

### 4. Connect to GitHub and Push
After creating your GitHub repository, you'll see instructions. Use these commands:
```bash
git remote add origin https://github.com/YOUR-USERNAME/legalassist-ai.git
git branch -M main
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

### 5. Verify the Import
1. Refresh your GitHub repository page
2. You should see all the project files and directories

## Project Structure
- `backend/`: Flask backend with OpenAI integration
- `frontend/`: React frontend with TailwindCSS
- `deployment/`: Deployment instructions and configuration

## Important Notes
- The `.gitignore` file is already set up to exclude unnecessary files
- The OpenAI API key is included in the backend code as requested
- Both frontend and backend are already deployed and accessible at the URLs provided earlier
