from typing import List, Dict, Any
from vector_db import VectorDB

class Retriever:
    def __init__(self, vector_db: VectorDB):
        self.vector_db = vector_db
    
    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieve the most relevant document chunks for a given query.
        
        Args:
            query: The query string to search for
            top_k: Number of relevant chunks to retrieve
            
        Returns:
            List of relevant document chunks with metadata
        """
        try:
            # Search for relevant chunks in the vector DB
            results = self.vector_db.search(query, top_k=top_k)
            
            # If no results found, return empty list
            if not results:
                print(f"No relevant documents found for query: {query}")
                return []
            
            # Log the results
            print(f"Found {len(results)} relevant chunks for query: {query}")
            for i, result in enumerate(results):
                print(f"Result {i+1}: distance={result['distance']:.4f}, id={result['chunk_id']}")
                
            return results
            
        except Exception as e:
            print(f"Error during retrieval: {str(e)}")
            raise
    
    def get_context_from_results(self, results: List[Dict[str, Any]]) -> str:
        """
        Combine retrieved chunks into a single context string.
        
        Args:
            results: List of retrieval results
            
        Returns:
            Combined context as a single string
        """
        if not results:
            return ""
        
        # Combine all retrieved texts into a single context
        context_parts = [f"RELEVANT DOCUMENT {i+1}:\n{result['text']}\n\n" 
                        for i, result in enumerate(results)]
        
        context = "".join(context_parts)
        return context 