# CloudVault ☁️

**CloudVault** is your personal, secure sanctuary for all your digital files. Designed with simplicity and security at its core, CloudVault allows you to upload, organize, and access your data from anywhere in the world.

![CloudVault Dashboard](frontend/src/assets/dashboard.png)

## What is CloudVault?

CloudVault is more than just a storage app; it's a complete workspace for your digital life. Whether you are a student keeping track of assignments, a professional managing project documents, or just looking for a safe place for your family photos, CloudVault provides the tools you need to stay organized and secure.

## Key Features

### 📁 Effortless File Management
Upload your files in seconds. With our intuitive interface, you can manage your documents, images, and videos with ease. Need a file back? Download it instantly with a single click.

### 📂 Smart Organization
Stop digging through endless lists of files. Create custom folders and subfolders to categorize your data exactly how you want it. Our nested folder system makes it easy to keep even the largest collections tidy.

### 🔐 Secure & Private
Your security is our top priority. CloudVault uses modern authentication standards to ensure that only you have access to your vault. Sign up, log in, and rest easy knowing your files are protected.

### 🌗 Light & Dark Modes
Whether you're working in a bright office or late at night, CloudVault adjusts to your needs. Toggle between beautiful Light and Dark themes with a single tap.

### 📱 Fully Responsive
Access your vault on your desktop, tablet, or smartphone. CloudVault is built to look great and work perfectly on any screen size.

---

## Getting Started

To get your own instance of CloudVault running locally, follow these simple steps:

### Prerequisites
- **Java 17** or higher
- **Node.js** (v18 or higher)
- **Maven**

### 1. Start the Backend
Open your terminal in the root directory and run:
```bash
./mvnw spring-boot:run
```
The server will start at `http://localhost:8080`.

### 2. Start the Frontend
Navigate to the `frontend` directory and run:
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

## Built With
- **Spring Boot** - A robust backend for secure data handling.
- **React & Vite** - A lightning-fast, modern frontend experience.
- **TypeScript** - Ensuring reliability and performance.
- **PostgreSQL/SQLite** - Reliable database storage for your metadata.

---
*CloudVault — Secure. Simple. Yours.*