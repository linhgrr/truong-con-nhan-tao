import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Tuple
import pickle

class VectorDB:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", index_path: str = "../models/faiss_index"):
        self.model_name = model_name
        self.index_path = index_path
        self.embedding_dim = 384  # all-MiniLM-L6-v2 has 384 dimensions
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.chunks = []
        self.chunk_size = 800  # target tokens per chunk
        self.chunk_overlap = 200  # overlap between chunks
        
    def load_document(self, file_path: str) -> List[str]:
        """Load a document and split it into chunks."""
        print(f"Loading document from {file_path}")
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # Split text into sentences or paragraphs
        paragraphs = [p for p in text.split('\n\n') if p.strip()]
        
        # Combine paragraphs into chunks of appropriate size
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            # Simple token count approximation
            approx_tokens = len(paragraph.split())
            
            if len(current_chunk.split()) + approx_tokens <= self.chunk_size:
                current_chunk += paragraph + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = paragraph + "\n\n"
        
        # Add the last chunk if it's not empty
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        self.chunks = chunks
        print(f"Document split into {len(chunks)} chunks")
        return chunks
    
    def create_embeddings(self) -> np.ndarray:
        """Create embeddings for each text chunk."""
        if not self.chunks:
            raise ValueError("No chunks loaded. Call load_document first.")
        
        print("Creating embeddings...")
        embeddings = self.model.encode(self.chunks, show_progress_bar=True)
        return embeddings
    
    def build_index(self, embeddings: np.ndarray) -> None:
        """Build a FAISS index from embeddings."""
        print("Building FAISS index...")
        self.index = faiss.IndexFlatL2(self.embedding_dim)
        self.index = faiss.IndexIDMap(self.index)
        
        # Add embeddings to the index with IDs
        self.index.add_with_ids(
            embeddings.astype(np.float32),
            np.array(range(len(embeddings))).astype(np.int64)
        )
        print(f"Index built with {self.index.ntotal} vectors")
    
    def save_index(self) -> None:
        """Save the FAISS index and chunks to disk."""
        if self.index is None:
            raise ValueError("No index to save. Call build_index first.")
        
        os.makedirs(self.index_path, exist_ok=True)
        
        # Save the FAISS index
        index_file = os.path.join(self.index_path, "index.faiss")
        faiss.write_index(self.index, index_file)
        
        # Save the chunks for retrieval
        chunks_file = os.path.join(self.index_path, "chunks.pkl")
        with open(chunks_file, 'wb') as f:
            pickle.dump(self.chunks, f)
        
        print(f"Index and chunks saved to {self.index_path}")
    
    def load_index(self) -> None:
        """Load the FAISS index and chunks from disk."""
        index_file = os.path.join(self.index_path, "index.faiss")
        chunks_file = os.path.join(self.index_path, "chunks.pkl")
        
        if not (os.path.exists(index_file) and os.path.exists(chunks_file)):
            raise FileNotFoundError(f"Index files not found in {self.index_path}")
        
        # Load the FAISS index
        self.index = faiss.read_index(index_file)
        
        # Load the chunks
        with open(chunks_file, 'rb') as f:
            self.chunks = pickle.load(f)
        
        print(f"Loaded index with {self.index.ntotal} vectors and {len(self.chunks)} chunks")
    
    def search(self, query: str, top_k: int = 3) -> List[Dict[str, any]]:
        """Search the index for chunks most similar to the query."""
        if self.index is None:
            raise ValueError("No index loaded. Call load_index first.")
        
        # Encode the query
        query_embedding = self.model.encode([query])[0].reshape(1, -1).astype(np.float32)
        
        # Search the index
        distances, indices = self.index.search(query_embedding, top_k)
        
        # Prepare results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1:  # FAISS returns -1 for not enough results
                results.append({
                    "chunk_id": int(idx),
                    "distance": float(distances[0][i]),
                    "text": self.chunks[idx]
                })
        
        return results

# Helper function to initialize and prepare vector database
def initialize_vector_db(document_path: str) -> VectorDB:
    """Initialize and prepare the vector database with the document."""
    vector_db = VectorDB()
    
    # Check if index already exists
    index_file = os.path.join(vector_db.index_path, "index.faiss")
    chunks_file = os.path.join(vector_db.index_path, "chunks.pkl")
    
    if os.path.exists(index_file) and os.path.exists(chunks_file):
        print("Loading existing index...")
        vector_db.load_index()
    else:
        print("Building new index...")
        chunks = vector_db.load_document(document_path)
        embeddings = vector_db.create_embeddings()
        vector_db.build_index(embeddings)
        vector_db.save_index()
    
    return vector_db 