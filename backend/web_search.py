import aiohttp
import asyncio
from typing import List, Dict, Any
from duckduckgo_search import DDGS
import re
import os
from dotenv import load_dotenv

# Số lượng kết quả tìm kiếm tối đa
MAX_SEARCH_RESULTS = 5
# Số lượng từ tối đa trong mỗi snippet
MAX_SNIPPET_WORDS = 150

class WebSearcher:
    """Lớp xử lý tìm kiếm thông tin từ internet."""
    
    def __init__(self):
        self.ddgs = DDGS()
    
    async def search(self, query: str, max_results: int = MAX_SEARCH_RESULTS) -> List[Dict[str, Any]]:
        """
        Thực hiện tìm kiếm web thông qua DuckDuckGo.
        
        Args:
            query: Chuỗi truy vấn tìm kiếm
            max_results: Số lượng kết quả tối đa trả về
            
        Returns:
            Danh sách kết quả tìm kiếm, mỗi kết quả gồm title, snippet, và url
        """
        try:
            # Chuẩn hóa query để tìm kiếm trên web tốt hơn
            search_query = self._normalize_query(query)
            print(f"Searching web for: {search_query}")
            
            # Sử dụng DuckDuckGo Search API
            results = []
            try:
                # Sử dụng DuckDuckGo Search trong thread pool để không block event loop
                loop = asyncio.get_event_loop()
                raw_results = await loop.run_in_executor(
                    None, lambda: list(self.ddgs.text(search_query, max_results=max_results))
                )
                
                # Xử lý kết quả thô thành định dạng chuẩn
                for result in raw_results:
                    results.append({
                        "title": result.get("title", ""),
                        "snippet": self._clean_snippet(result.get("body", "")),
                        "url": result.get("href", "")
                    })
                    
            except Exception as e:
                print(f"Error during DuckDuckGo search: {str(e)}")
                # Fallback nếu DDG không hoạt động
                pass
                
            return results
            
        except Exception as e:
            print(f"Error in web search: {str(e)}")
            return []
    
    def _normalize_query(self, query: str) -> str:
        """
        Chuẩn hóa query để tìm kiếm web hiệu quả hơn.
        Loại bỏ các định dạng câu hỏi trắc nghiệm.
        """
        # Loại bỏ phần A, B, C, D options từ câu hỏi
        lines = query.split("\n")
        main_question = lines[0] if lines else query
        
        # Loại bỏ "?" hoặc dấu câu cuối cùng nếu có
        main_question = re.sub(r'\?+$', '', main_question)
        
        return main_question.strip()
    
    def _clean_snippet(self, text: str) -> str:
        """Làm sạch và rút gọn snippet nếu quá dài."""
        if not text:
            return ""
        
        # Loại bỏ ký tự không cần thiết
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Rút gọn snippet nếu quá dài
        words = text.split()
        if len(words) > MAX_SNIPPET_WORDS:
            text = ' '.join(words[:MAX_SNIPPET_WORDS]) + '...'
            
        return text
        
    def format_web_results(self, results: List[Dict[str, Any]]) -> str:
        """
        Định dạng kết quả tìm kiếm web thành chuỗi văn bản để sử dụng làm context.
        
        Args:
            results: Danh sách kết quả tìm kiếm
            
        Returns:
            Chuỗi định dạng của kết quả tìm kiếm
        """
        if not results:
            return "Không tìm thấy thông tin liên quan trên web."
        
        formatted_results = ["WEB SEARCH RESULTS:"]
        
        for i, result in enumerate(results):
            title = result.get("title", "Không có tiêu đề")
            snippet = result.get("snippet", "Không có nội dung")
            url = result.get("url", "#")
            
            formatted_results.append(f"{i+1}. {title}")
            formatted_results.append(f"   {snippet}")
            formatted_results.append(f"   URL: {url}")
            formatted_results.append("")
        
        return "\n".join(formatted_results) 