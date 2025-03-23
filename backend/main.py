import os
import json
from fastapi import FastAPI, Request, HTTPException, Depends, Form
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from pathlib import Path
from dotenv import load_dotenv

# Import our RAG components
from vector_db import VectorDB, initialize_vector_db
from rag_pipeline import RAGPipeline

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="RAG Question Answering System")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to the document file
DOCUMENT_PATH = "../data/knowledge.txt"
ENV_PATH = "../.env"

# Initialize the vector DB and RAG pipeline
vector_db = None
rag_pipeline = None
gemini_api_key = os.getenv("GEMINI_API_KEY", "")

# Helper function to check if API key is set
def is_api_key_set():
    return gemini_api_key and gemini_api_key.strip() != ""

# Helper function to update API key in .env file
def update_api_key(api_key):
    global gemini_api_key
    gemini_api_key = api_key
    
    # Update environment variable in memory
    os.environ["GEMINI_API_KEY"] = api_key
    
    # Update .env file
    env_content = ""
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r") as f:
            lines = f.readlines()
            env_content = "".join([line for line in lines if not line.startswith("GEMINI_API_KEY")])
    
    with open(ENV_PATH, "w") as f:
        f.write(f"{env_content}\nGEMINI_API_KEY={api_key}\n")
    
    print(f"Updated API key in .env file")

@app.on_event("startup")
async def startup_event():
    """Initialize components when the app starts."""
    global vector_db, rag_pipeline, gemini_api_key
    
    # Make sure the document file exists
    if not os.path.exists(DOCUMENT_PATH):
        print(f"ERROR: Document file not found at {DOCUMENT_PATH}")
        print("Please place a knowledge.txt file in the data directory.")
        # We'll continue anyway to avoid crashing, but the app won't work correctly
    
    try:
        # Initialize vector DB
        print("Initializing vector database...")
        vector_db = initialize_vector_db(DOCUMENT_PATH)
        
        # Initialize RAG pipeline
        print("Initializing RAG pipeline...")
        rag_pipeline = RAGPipeline(vector_db)
        
        print("Startup completed successfully!")
    
    except Exception as e:
        print(f"Error during startup: {str(e)}")
        # Again, we continue to avoid crashing, but functionality will be limited

# Define request models
class QuestionRequest(BaseModel):
    question: str
    use_web_search: bool = True  # Cho phép tùy chọn bật/tắt tìm kiếm web

class ApiKeyRequest(BaseModel):
    api_key: str

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve a simple HTML page with instructions to use the React frontend."""
    return """
    <html>
        <head>
            <title>RAG Question Answering System</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                code { background-color: #f0f0f0; padding: 2px 4px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <h1>RAG Question Answering System</h1>
            <p>This is the API backend for the RAG Question Answering System.</p>
            <p>The frontend is separately served. You can interact with this API directly at:</p>
            <ul>
                <li><code>POST /ask</code> - Send a question to get an answer</li>
                <li><code>POST /set-api-key</code> - Set your Gemini API key</li>
                <li><code>GET /api-key-status</code> - Check if API key is set</li>
            </ul>
            <p>Example POST body:</p>
            <pre><code>
            {
                "question": "Which component of RAG is responsible for finding relevant documents?\\nA. Generator\\nB. Retriever\\nC. Embedder\\nD. Transformer"
            }
            </code></pre>
        </body>
    </html>
    """

@app.get("/api-key-status")
async def get_api_key_status():
    """Check if an API key is set."""
    return {"is_set": is_api_key_set()}

@app.post("/set-api-key")
async def set_api_key(request: ApiKeyRequest):
    """Set the Gemini API key."""
    try:
        if not request.api_key or request.api_key.strip() == "":
            raise HTTPException(status_code=400, detail="API key cannot be empty")
        
        # Update the API key
        update_api_key(request.api_key)
        
        # Re-initialize RAG pipeline to use the new API key
        global rag_pipeline
        rag_pipeline = RAGPipeline(vector_db)
        
        return {"status": "success", "message": "API key set successfully"}
    
    except Exception as e:
        print(f"Error setting API key: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    """Process a question and return an answer using the RAG pipeline."""
    global rag_pipeline
    
    # Check if API key is set
    if not is_api_key_set():
        return {
            "status": "error",
            "message": "API key not set",
            "need_api_key": True
        }
    
    if not rag_pipeline:
        raise HTTPException(status_code=500, detail="RAG pipeline not initialized")
    
    try:
        # Process the question through the RAG pipeline with web search option
        result = await rag_pipeline.answer_question(
            question=request.question,
            use_web_search=request.use_web_search
        )
        return result
    
    except Exception as e:
        print(f"Error processing question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Create a .env file if it doesn't exist
def create_env_file():
    env_path = "../.env"
    if not os.path.exists(env_path):
        with open(env_path, "w") as f:
            f.write("# Add your Gemini API key here\n")
            f.write("GEMINI_API_KEY=\n")
        print(f"Created .env file at {env_path}. Please add your Gemini API key.")

if __name__ == "__main__":
    # Create .env file if needed
    create_env_file()
    
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8000))
    
    # Run the API server
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 