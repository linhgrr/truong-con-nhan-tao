import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setResult(response.data);
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

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-3xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900">Chủ nghĩa xã hội helper</h1>
              <p className="mt-2 text-sm text-gray-500">Bộ công cụ vip pro.</p>
            </div>
            
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
                    placeholder="Enter your question here
                    Example: Tôi là
                    A. Taga
                    B. Trường
                    C. Vip
                    D. Hedspi"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default App; 