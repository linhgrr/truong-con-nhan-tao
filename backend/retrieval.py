from typing import List, Dict, Any
from vector_db import VectorDB
from web_search import WebSearcher

class Retriever:
    def __init__(self, vector_db: VectorDB):
        self.vector_db = vector_db
        self.web_searcher = WebSearcher()
    
    async def retrieve(self, query: str, top_k: int = 3, use_web_search: bool = True) -> Dict[str, Any]:
        """
        Retrieve the most relevant document chunks for a given query.
        Optionally also retrieve information from the web.
        
        Args:
            query: The query string to search for
            top_k: Number of relevant chunks to retrieve from vector DB
            use_web_search: Whether to include web search results
            
        Returns:
            Dictionary with local and web search results
        """
        try:
            # Search results container
            all_results = {
                "local_results": [],
                "web_results": []
            }
            
            # 1. Retrieve from local vector DB
            local_results = self.vector_db.search(query, top_k=top_k)
            
            # Log the results
            if local_results:
                print(f"Found {len(local_results)} relevant chunks for query: {query}")
                for i, result in enumerate(local_results):
                    print(f"Result {i+1}: distance={result['distance']:.4f}, id={result['chunk_id']}")
            else:
                print(f"No relevant documents found locally for query: {query}")
            
            all_results["local_results"] = local_results
            
            # 2. Optional web search for additional context
            if use_web_search:
                web_results = await self.web_searcher.search(query)
                all_results["web_results"] = web_results
                print(f"Found {len(web_results)} web search results for query: {query}")
                
            return all_results
            
        except Exception as e:
            print(f"Error during retrieval: {str(e)}")
            raise
    
    def get_context_from_results(self, results: Dict[str, Any], max_local_results: int = 3, max_web_results: int = 3) -> str:
        """
        Combine both local and web results into a single context string.
        
        Args:
            results: Dictionary with local_results and web_results
            max_local_results: Maximum number of local results to include
            max_web_results: Maximum number of web results to include
            
        Returns:
            Combined context as a single string
        """
        context_parts = []
        
        # 1. Add local document chunks if available
        local_results = results.get("local_results", [])
        if local_results:
            context_parts.append("LOCAL KNOWLEDGE BASE:")
            for i, result in enumerate(local_results[:max_local_results]):
                context_parts.append(f"DOCUMENT {i+1}:\n{result['text']}\n")
            context_parts.append("\n")
            
        # 2. Add web search results if available
        web_results = results.get("web_results", [])
        if web_results:
            # Sử dụng hàm format trong WebSearcher để định dạng kết quả web
            web_context = self.web_searcher.format_web_results(web_results[:max_web_results])
            context_parts.append(web_context)
            
        # Combine all parts
        if not context_parts:
            return "Không tìm thấy thông tin liên quan."
            
        context = "\n".join(context_parts)
        return context 