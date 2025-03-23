from typing import Dict, Any, List
from vector_db import VectorDB
from retrieval import Retriever
from gemini_api import GeminiClient

class RAGPipeline:
    def __init__(self, vector_db: VectorDB):
        self.vector_db = vector_db
        self.retriever = Retriever(vector_db)
        self.llm_client = GeminiClient()
        
    async def answer_question(self, question: str, top_k: int = 3, use_web_search: bool = True) -> Dict[str, Any]:
        """
        Process a question through the RAG pipeline.
        
        Args:
            question: The multiple-choice question to answer
            top_k: Number of relevant document chunks to retrieve
            use_web_search: Whether to include web search results
            
        Returns:
            Dictionary with answer, reasoning, and relevant contexts
        """
        try:
            # Step 1: Retrieve relevant document chunks and optionally web results
            retrieved_results = await self.retriever.retrieve(question, top_k=top_k, use_web_search=use_web_search)
            
            # Step 2: Prepare context for the LLM
            context = self.retriever.get_context_from_results(retrieved_results)
            
            # If no relevant documents found, return early
            if not context or context == "Không tìm thấy thông tin liên quan.":
                return {
                    "answer": "Không đủ thông tin",
                    "reasoning": "No relevant information found in the knowledge base or web search.",
                    "contexts": []
                }
            
            # Step 3: Generate answer using the LLM
            response = await self.llm_client.answer_mcq(question, context)
            
            # Step 4: Prepare the final result
            # Chuẩn bị contexts để trả về cho frontend
            local_contexts = [res["text"] for res in retrieved_results.get("local_results", [])]
            web_contexts = []
            for web_result in retrieved_results.get("web_results", []):
                web_context = f"{web_result.get('title')} - {web_result.get('snippet')}\nURL: {web_result.get('url')}"
                web_contexts.append(web_context)
            
            result = {
                "answer": response.get("answer", "Không đủ thông tin"),
                "reasoning": response.get("reasoning", "No reasoning provided."),
                "contexts": {
                    "local": local_contexts,
                    "web": web_contexts
                },
                "has_web_results": len(web_contexts) > 0
            }
            
            return result
            
        except Exception as e:
            print(f"Error in RAG pipeline: {str(e)}")
            return {
                "answer": "Error",
                "reasoning": f"An error occurred: {str(e)}",
                "contexts": {"local": [], "web": []},
                "has_web_results": False
            } 