# RAG-based Multiple Choice Question Answering System

This project implements a Retrieval-Augmented Generation (RAG) system to answer multiple-choice questions based on a large text document. It features a React frontend and a FastAPI backend.

## Project Structure

```
rag_project/ 
│── data/
│   ├── knowledge.txt  # Text document for knowledge base
│── models/
│   ├── faiss_index/   # Stores FAISS index
│── backend/
│   ├── main.py        # FastAPI backend 
│   ├── vector_db.py   # Vector database handling
│   ├── retrieval.py   # Document retrieval
│   ├── rag_pipeline.py # RAG pipeline integration
│   ├── gemini_api.py  # Google Gemini API integration
│── frontend/
│   ├── public/        # Static files
│   ├── src/           # React source code
│   ├── package.json   # Frontend dependencies
│── .env               # Environment variables
│── requirements.txt   # Python dependencies
```

## Setup Instructions

### 1. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 2. Gemini API Key Setup

The application uses Google's Gemini API for answering multiple-choice questions. There are two ways to set up the API key:

#### Option 1: Direct in .env file
1. Get a Gemini API key from: https://aistudio.google.com/app/apikey
2. Add your API key to the `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

#### Option 2: Via the web interface
1. Start the application (instructions below)
2. When you access the application for the first time, it will prompt you to enter your API key
3. Get a Gemini API key from: https://aistudio.google.com/app/apikey
4. Enter the key in the form and submit
5. The key will be stored for future use

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

## Running the Application

### 1. Start the Backend

```bash
cd backend
python main.py
```

The server will start at `http://localhost:8000`.

### 2. Start the Frontend

In a new terminal:

```bash
cd frontend
npm start
```

The frontend will start at `http://localhost:3000`.

## How to Use

1. Enter a multiple-choice question in the text area, including all options labeled A, B, C, D.
2. Click "Submit Question" to get an answer.
3. The system will retrieve relevant documents, send them to Gemini API, and display the answer along with reasoning.

## New Features

### API Key Management
- First-time users are prompted to enter their Gemini API key
- API key is stored securely on the server and persisted in the .env file
- Key can be updated at any time by submitting a new one

## Technologies Used

- **Backend**: Python, FastAPI, sentence-transformers, FAISS, Google Gemini API
- **Frontend**: React, TailwindCSS, Axios
- **Vector Database**: FAISS

## Example Question

```
Which component of RAG is responsible for finding relevant documents?
A. Generator
B. Retriever
C. Embedder
D. Transformer
``` 