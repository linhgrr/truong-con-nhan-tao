import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(true);

  // Kiểm tra trạng thái API key khi component được tải
  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  // Kiểm tra xem API key đã được thiết lập chưa
  const checkApiKeyStatus = async () => {
    try {
      const response = await axios.get('/api-key-status');
      setIsApiKeySet(response.data.is_set);
      setShowApiKeyForm(!response.data.is_set);
    } catch (err) {
      console.error('Error checking API key status:', err);
      setShowApiKeyForm(true);
    }
  };

  // Xử lý submit API key
  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/set-api-key', { api_key: apiKey });
      if (response.data.status === 'success') {
        setIsApiKeySet(true);
        setShowApiKeyForm(false);
        setError('');
      }
    } catch (err) {
      console.error('Error setting API key:', err);
      setError(err.response?.data?.detail || 'Failed to set API key');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý submit câu hỏi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      // Hiển thị thông báo chờ đợi nếu sử dụng tìm kiếm web
      const loadingStart = Date.now();
      
      // Gửi kèm tùy chọn tìm kiếm web
      const response = await axios.post('/ask', { 
        question,
        use_web_search: useWebSearch 
      });
      
      // Đảm bảo spinner hiển thị ít nhất 1 giây để người dùng không bị nhấp nháy quá nhanh
      const processingTime = Date.now() - loadingStart;
      if (processingTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - processingTime));
      }
      
      // Kiểm tra nếu cần API key
      if (response.data.need_api_key) {
        setShowApiKeyForm(true);
        setError('Please set your Gemini API key first');
      } else {
        setResult(response.data);
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      setError(err.response?.data?.detail || 'An error occurred while processing your question');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render the answer with correct styling
  const renderAnswer = (answer) => {
    if (!answer || answer === 'Error' || answer === 'Không đủ thông tin') {
      return <span className="text-red-500">{answer || 'Không đủ thông tin'}</span>;
    }
    
    // Highlight the selected option
    return (
      <span className="font-bold text-green-600">{answer}</span>
    );
  };

  // Render API key form
  const renderApiKeyForm = () => {
    return (
      <div className="mt-6 rounded-md bg-yellow-50 p-6 border border-yellow-200">
        <h3 className="text-lg font-medium text-yellow-800 mb-3">Gemini API Key Required</h3>
        <p className="text-sm text-gray-700 mb-4">
          To use this application, you need to provide a Gemini API key. 
          You can get a free API key from <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Google AI Studio
          </a>.
        </p>
        
        <form onSubmit={handleApiKeySubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              Gemini API Key
            </label>
            <input
              type="text"
              id="apiKey"
              name="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your Gemini API key"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? 'Setting API Key...' : 'Save API Key'}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Your API key will be stored securely on the server and will be used for future requests.
          </p>
        </form>
      </div>
    );
  };

  // Function mới để hiển thị kết quả web
  const renderWebResults = (webContexts) => {
    if (!webContexts || webContexts.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 border-t pt-4">
        <h4 className="text-md font-medium text-blue-800 mb-2">Web Search Results</h4>
        <div className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-60">
          {webContexts.map((context, index) => (
            <div key={index} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
              {context.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('URL:') ? 'text-blue-600 text-xs hover:underline cursor-pointer' : 'text-gray-700'}>
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Thêm component mới để giải thích tính năng web search
  const renderWebSearchInfo = () => {
    return (
      <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
        <h4 className="text-md font-medium text-gray-800 mb-2">Giới thiệu tính năng tìm kiếm Web 🌐</h4>
        <p className="text-sm text-gray-700 mb-2">
          Tính năng tìm kiếm thông tin từ internet và kết hợp kết quả với cơ sở dữ liệu có sẵn.
        </p>
        <div className="text-sm text-gray-700">
          <p className="font-medium mb-1">Lợi ích:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Trả lời câu hỏi ngay cả khi gặp thông tin không có trong sách.</li>
            <li>Xác minh và đối chiếu thông tin từ nhiều nguồn</li>
            <li>Cung cấp thông tin mới nhất và cập nhật</li>
          </ul>
        </div>
        <div className="mt-2 text-gray-500 text-xs">
          <p>Bạn có thể bật/tắt tính năng này bằng checkbox bên dưới.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-6xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-8 bg-white shadow-lg sm:rounded-3xl sm:p-12">
          <div className="mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-extrabold text-gray-900">CNXH Helper</h1>
              <p className="mt-2 text-sm text-gray-500">Thông tin có thể hơi điêu. Cân nhắc kỹ trước khi chọn đáp án. Nếu hiện error, ấn tìm kiếm lại nha kkkk</p>
              
              {/* Giới thiệu tính năng mới
              <div className="mt-3 bg-blue-50 rounded-md p-3 text-left text-sm text-blue-700 max-w-3xl mx-auto">
                <p className="font-medium">✨ Tính năng mới: Tìm kiếm Web</p>
                <p className="mt-1">Hệ thống giờ đây có thể tìm kiếm thông tin trên mạng để bổ sung kiến thức và tăng độ chính xác cho câu trả lời.</p>
              </div> */}
            </div>
            
            {/* Layout hai cột */}
            <div className="flex flex-col lg:flex-row lg:space-x-8 mt-6">
              {/* Cột nhập liệu */}
              <div className="lg:w-2/5 flex-shrink-0">
                {/* Show API Key form if needed */}
                {showApiKeyForm && renderApiKeyForm()}
                
                {/* Hiển thị thông tin về web search khi người dùng chưa submit câu hỏi */}
                {!result && !loading && !error && !showApiKeyForm && renderWebSearchInfo()}
                
                {/* Question form */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-5">
                  <div>
                    <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                      Question (include options labeled A, B, C, D)
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="question"
                        name="question"
                        rows="6"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                        placeholder="Who is taga?
A. Taga
B. Trường
C. Vip
D. Hedspi"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Thêm tùy chọn tìm kiếm web */}
                  <div className="flex items-center bg-gray-50 p-3 rounded">
                    <input
                      id="web-search"
                      name="web-search"
                      type="checkbox"
                      checked={useWebSearch}
                      onChange={(e) => setUseWebSearch(e.target.checked)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="web-search" className="ml-3 block text-sm text-gray-900">
                      Enable web search for additional information
                    </label>
                    {useWebSearch && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        May take longer
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={loading || showApiKeyForm}
                      className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        loading || showApiKeyForm ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {useWebSearch ? 'Searching web & processing...' : 'Processing...'}
                        </span>
                      ) : 'Submit Question'}
                    </button>
                  </div>
                </form>
                
                {error && (
                  <div className="mt-6 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">{error}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {loading && (
                  <div className="mt-6 text-center py-4">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {useWebSearch ? 
                        'Searching web and analyzing results...' : 
                        'Processing your question...'}
                    </div>
                    {useWebSearch && (
                      <p className="mt-2 text-sm text-gray-500">
                        Web search may take a few seconds...
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Cột kết quả - Hiển thị kết quả và thông tin */}
              <div className="lg:w-3/5 mt-6 lg:mt-0 flex-shrink-0">
                {result ? (
                  <div className="rounded-md bg-blue-50 p-5 h-full overflow-auto shadow-inner">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-blue-800">Result</h3>
                      {result.has_web_results && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Enhanced with web search
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-4 bg-white rounded-md p-4 shadow-sm">
                      <p className="text-sm text-gray-700 mb-1 font-medium">Answer:</p>
                      <p className="text-xl">{renderAnswer(result.answer)}</p>
                    </div>
                    
                    <div className="mt-4 bg-white rounded-md p-4 shadow-sm">
                      <p className="text-sm text-gray-700 mb-1 font-medium">Reasoning:</p>
                      <p className="text-sm text-gray-900">{result.reasoning}</p>
                    </div>

                    {/* Tabs UI cho hiển thị nguồn thông tin */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center border-b border-gray-200">
                        <div className="font-medium text-gray-700 py-2">Information Sources:</div>
                      </div>
                      
                      <div className="mt-4">
                        {/* Hiển thị nguồn thông tin từ cơ sở dữ liệu */}
                        {result.contexts && result.contexts.local && result.contexts.local.length > 0 && (
                          <div className="mb-5">
                            <h4 className="text-md font-medium text-blue-800 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                              </svg>
                              Knowledge Base
                            </h4>
                            <div className="bg-gray-50 p-3 rounded max-h-60 overflow-auto text-sm shadow-inner">
                              {result.contexts.local.map((context, index) => (
                                <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                                  <p className="text-gray-700">{context}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hiển thị kết quả tìm kiếm web */}
                        {result.has_web_results && result.contexts && result.contexts.web && (
                          <div>
                            <h4 className="text-md font-medium text-blue-800 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd"></path>
                              </svg>
                              Web Search Results
                            </h4>
                            <div className="bg-gray-50 p-3 rounded max-h-60 overflow-auto text-sm shadow-inner">
                              {result.contexts.web.map((context, index) => (
                                <div key={index} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                                  {context.split('\n').map((line, i) => (
                                    <p key={i} className={line.startsWith('URL:') ? 'text-blue-600 text-xs hover:underline cursor-pointer' : 'text-gray-700'}>
                                      {line}
                                    </p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-md p-8 h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                      <p className="mt-4 text-gray-500 text-center font-medium">
                        Kết quả tìm kiếm và thông tin <br/>sẽ hiển thị tại đây
                      </p>
                      <p className="mt-2 text-gray-400 text-sm">
                        Nhập câu hỏi và bấm nút gửi để bắt đầu
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 