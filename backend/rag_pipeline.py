from typing import Dict, Any, List
from vector_db import VectorDB
from retrieval import Retriever
from gemini_api import GeminiClient

class RAGPipeline:
    def __init__(self, vector_db: VectorDB):
        self.vector_db = vector_db
        self.retriever = Retriever(vector_db)
        self.llm_client = GeminiClient()
        
    async def answer_question(self, question: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Process a question through the RAG pipeline.
        
        Args:
            question: The multiple-choice question to answer
            top_k: Number of relevant document chunks to retrieve
            
        Returns:
            Dictionary with answer, reasoning, and relevant contexts
        """
        try:
            # Step 1: Retrieve relevant document chunks
            retrieved_results = self.retriever.retrieve(question, top_k=top_k)
            
            # Step 2: Prepare context for the LLM
            context = self.retriever.get_context_from_results(retrieved_results)
            
            # If no relevant documents found, return early
            if not context:
                return {
                    "answer": "Không đủ thông tin",
                    "reasoning": "No relevant information found in the knowledge base.",
                    "contexts": []
                }
            
            # Step 3: Generate answer using the LLM
            response = await self.llm_client.answer_mcq(question, context)
            
            # Step 4: Prepare the final result
            result = {
                "answer": response.get("answer", "Không đủ thông tin"),
                "reasoning": response.get("reasoning", "No reasoning provided."),
                "contexts": [res["text"] for res in retrieved_results]
            }
            
            return result
            
        except Exception as e:
            print(f"Error in RAG pipeline: {str(e)}")
            return {
                "answer": "Error",
                "reasoning": f"An error occurred: {str(e)}",
                "contexts": []
            } 