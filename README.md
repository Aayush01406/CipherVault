# CipherVault - Secure End-to-End Encrypted Sharing

CipherVault is a modern full-stack web application designed for secure end-to-end encrypted file and message sharing. Built with a focus on privacy and security, it ensures that your data is encrypted on your device before it ever reaches our servers.

## 🚀 Features

- **E2E Encryption**: AES-256-GCM encryption performed entirely in the browser.
- **Secure Sharing**: Password-protected sharing links with expiration and download limits.
- **Google OAuth**: Secure authentication using Firebase/Google.
- **Dashboard**: Manage your encrypted files and secret messages.
- **Security Audit Logs**: Track all access and operations in your vault.
- **Modern UI/UX**: Beautiful glassmorphism design with smooth animations.

## 🛠 Tech Stack

- **Frontend**: Next.js, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Auth**: Firebase Authentication (Google OAuth)
- **Storage**: Cloudinary (for encrypted file storage)
- **Encryption**: Web Crypto API (AES-256-GCM + PBKDF2)

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Firebase Project (for Auth)
- Cloudinary Account (for storage)

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your credentials.
4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file based on `.env.local.example` and fill in your Firebase credentials.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security Principles

- **Zero-Knowledge**: We never see your decryption passwords or unencrypted data.
- **Client-Side Encryption**: Encryption happens in the browser using the Web Crypto API.
- **Password-Based Key Derivation**: Keys are derived from your password using PBKDF2 with 100,000 iterations.
- **Initialization Vectors (IV)**: Unique IVs are used for every encryption operation.

## 📄 License

MIT
