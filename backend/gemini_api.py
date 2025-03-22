import os
import json
import google.generativeai as genai
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Helper function to load Gemini API key
def load_gemini_api_key():
    # Reload environment variables
    load_dotenv(dotenv_path="../.env", override=True)
    
    # Get API key
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        return api_key
    else:
        print("WARNING: GEMINI_API_KEY not found in environment variables!")
        return None

# Load environment variables
load_gemini_api_key()

class GeminiClient:
    def __init__(self, model_name: str = "gemini-pro"):
        self.model_name = model_name
        # Check if API key is configured
        self.api_key = load_gemini_api_key()
        if not self.api_key:
            print("WARNING: Gemini API key not set. Please set GEMINI_API_KEY environment variable.")
        
    async def answer_mcq(self, question: str, context: str) -> Dict[str, Any]:
        """
        Get an answer for a multiple-choice question using Gemini API.
        
        Args:
            question: The multiple-choice question text including options
            context: The retrieved context to use for answering
            
        Returns:
            Dictionary with answer choice and reasoning
        """
        try:
            # Reload API key in case it was updated
            self.api_key = load_gemini_api_key()
            if not self.api_key:
                return {
                    "answer": "Error",
                    "reasoning": "Gemini API key not configured. Please set your API key."
                }
                
            # Generate the prompt for Gemini
            prompt = self._create_mcq_prompt(question, context)
            
            # Call Gemini API
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            
            # Parse the response
            result = self._parse_gemini_response(response.text)
            
            return result
        
        except Exception as e:
            print(f"Error calling Gemini API: {str(e)}")
            return {
                "answer": "Error",
                "reasoning": f"Failed to get answer from Gemini API: {str(e)}"
            }
    
    def _create_mcq_prompt(self, question: str, context: str) -> str:
        """Create a prompt for the Gemini API to answer a multiple-choice question."""
        return f"""You are an AI assistant that answers multiple-choice questions based ONLY on the provided context.

CONTEXT:
{context}

QUESTION:
{question}

Based ONLY on the information provided in the CONTEXT above, answer the multiple-choice question.
If the context doesn't contain enough information to answer with confidence, respond with "Không đủ thông tin" (Not enough information).

Return your answer in the following JSON format:
{{
  "answer": "A", 
  "reasoning": "Explanation of why this option is correct based on the context."
}}

Do not include any text outside of the JSON. Only respond with valid JSON."""
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Extract JSON from Gemini API response."""
        try:
            # Find JSON in the response - look for the first occurrence of { and the last occurrence of }
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_text = response_text[start_idx:end_idx]
                result = json.loads(json_text)
                return result
            else:
                # If no JSON found, create a default response
                return {
                    "answer": "Không đủ thông tin",
                    "reasoning": "Could not extract a valid answer from the AI response."
                }
                
        except json.JSONDecodeError:
            # Return default response if JSON parsing fails
            return {
                "answer": "Error",
                "reasoning": "Failed to parse AI response as JSON."
            } 