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
      const response = await axios.post('/ask', { question });
      
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

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-3xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900">RAG Question Answering</h1>
              <p className="mt-2 text-sm text-gray-500">Enter a multiple-choice question to get an answer based on the knowledge base.</p>
            </div>
            
            {/* Show API Key form if needed */}
            {showApiKeyForm && renderApiKeyForm()}
            
            {/* Question form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                  Question (include options labeled A, B, C, D)
                </label>
                <div className="mt-1">
                  <textarea
                    id="question"
                    name="question"
                    rows="5"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="Which component of RAG is responsible for finding relevant documents?
A. Generator
B. Retriever
C. Embedder
D. Transformer"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading || showApiKeyForm}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading || showApiKeyForm ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {loading ? 'Processing...' : 'Submit Question'}
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
            
            {result && (
              <div className="mt-6 rounded-md bg-blue-50 p-4">
                <h3 className="text-lg font-medium text-blue-800">Result</h3>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-700 mb-1">Answer:</p>
                  <p className="text-lg">{renderAnswer(result.answer)}</p>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-700 mb-1">Reasoning:</p>
                  <p className="text-sm text-gray-900">{result.reasoning}</p>
                </div>
                
                {result.contexts && result.contexts.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-700 mb-1">Relevant Contexts:</p>
                    <div className="mt-2 max-h-60 overflow-auto">
                      {result.contexts.map((context, index) => (
                        <div key={index} className="mb-2 p-2 bg-white rounded border border-gray-200">
                          <p className="text-xs text-gray-900 whitespace-pre-line">{context}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 