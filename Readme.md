# Mimotute AI Learning Platform

Mimotute is an AI-powered interactive learning platform designed to help users upload, analyze, and study books and learning materials. Featuring custom fine-tuned LLMs, automated text-to-speech, book difficulty classification, and interactive quizzes, Mimotute delivers an immersive multi-platform educational experience across Web and Android.

---

## Documentation & API Reference

* 📖 **[Mimotute API Documentation](api_documentation.md)**: Complete endpoint reference for Authentication, RAG Document Processing, AI Chat Streaming, User Profiles, and Assessments.

---

## Key Features

* **Interactive Book & Document Chat:** Upload PDFs to interact with localized chat models and ask contextual questions about specific chapters or books.
* **Automated Quiz & Q&A Generation:** Dynamically populate user quizzes and test assessments tailored to uploaded study materials.
* **Custom Fine-Tuned AI Engine:** Integrated with custom fine-tuned GGUF language models (`mimotute-fined-tuned.gguf`) alongside local inference tools like Ollama and Groq SDK.
* **Book Difficulty Scoring:** Employs trained machine learning models (`book_difficulty_model.joblib`, TF-IDF vectorizers) to evaluate and categorize reading materials.
* **Voice Synthesis & Text-to-Speech:** Integrated ONNX-based Kokoro TTS (`kokoro-v1.0.onnx`) for natural audio playback of learning content.
* **Cross-Platform Mobile Support:** Built with Capacitor to compile native Android applications alongside standard web deployments.

---

## Tech Stack

### Frontend
* **Framework:** React 19, Vite
* **Styling:** Tailwind CSS v4, DaisyUI
* **UI & Components:** Framer Motion, Lucide React, React Markdown, React Syntax Highlighter
* **Mobile Runtime:** Capacitor (Android)

### Backend Services
* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js
* **Database & Storage:** MongoDB / Mongoose, Cloudinary, Local PDF Storage
* **Authentication & Security:** JWT, BcryptJS, Cookie Parser, Arcjet Protection

### AI & Machine Learning Services
* **Framework:** Python, Flask/FastAPI (`app.py`), ONNX Runtime
* **LLM & Inference:** Local GGUF models, Ollama, Groq SDK
* **ML Pipelines:** Scikit-Learn (`joblib`), TF-IDF Vectorization, Custom Datasets
* **Text-to-Speech:** Kokoro TTS ONNX model

---

## Project Architecture

```
mimotute/
├── frontend/                   # React + Vite web & mobile client
│   ├── src/                    # UI Components, Router, Pages
│   └── package.json            # Frontend dependency manifest
│
├── backend/                    # Node.js + Express REST API server
│   ├── controllers/            # Auth, Book, Chapter, Profile, Q&A logic
│   ├── middlewares/            # Auth protection, Multer upload middlewares
│   ├── routes/                 # Express API routes
│   └── package.json            # Backend dependency manifest
│
├── ai-services/                # Machine learning & inference backend
│   ├── app.py                  # Python inference API
│   ├── mimotute-fined-tuned.gguf # Fine-tuned GGUF LLM weights
│   ├── kokoro-v1.0.onnx        # Text-to-speech model weights
│   └── book_difficulty_model.joblib # Scikit-Learn classification model
│
└── android/                    # Capacitor native Android wrapper & Gradle config
```

---

## Getting Started

### Prerequisites
* **Node.js:** `v18.x` or later
* **Python:** `3.10+` with required ML packages installed (`onnxruntime`, `joblib`, `scikit-learn`)
* **MongoDB:** Local instance or cloud database URI
* **Android Studio / Gradle:** Required only for native Android builds

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/mimotute.git
   cd mimotute
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
   Start the backend server:
   ```bash
   npm start
   ```

3. **AI Engine Setup**
   ```bash
   cd ../ai-services
   python -m venv venv
   source venv/bin/activate # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

5. **Building for Mobile (Android)**
   ```bash
   cd frontend
   npm run build
   npx cap sync android
   npx cap open android
   ```