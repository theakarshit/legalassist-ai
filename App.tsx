import { useState, useRef } from 'react';
import './App.css';

// Define types
interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface RelevantSegment {
  text: string;
  relevance_score: number;
}

// Removed unused interface
// interface Question {
//   text: string;
//   isFromAI: boolean;
// }

interface Message {
  text: string;
  isUser: boolean;
  tokenUsage?: TokenUsage;
  relevantSegments?: RelevantSegment[];
}

function App() {
  // State variables
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [docId, setDocId] = useState<string>('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [uploadTokenUsage, setUploadTokenUsage] = useState<TokenUsage | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'chat'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExt === 'pdf' || fileExt === 'docx') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
      } else {
        alert('Please upload a PDF or DOCX file');
      }
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      console.log('Starting upload to backend...');
      // Update API endpoint to use the deployed backend URL
      const response = await fetch('https://5000-injzzdag7qrd3e4rzbzg1-b54e9e30.manusvm.computer/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Upload successful, received data:', data);
      
      // Set state in a specific order to ensure proper rendering
      setDocId(data.doc_id);
      setSuggestedQuestions(data.suggested_questions || []);
      setUploadTokenUsage(data.token_usage);
      
      // Add welcome message first
      setMessages([
        {
          text: `I've analyzed "${data.filename}". Here are some questions you might want to ask:`,
          isUser: false
        }
      ]);
      
      console.log('Transitioning to chat interface...');
      // Force transition to chat interface with a small delay to ensure state updates
      setTimeout(() => {
        setActiveTab('chat');
        console.log('Active tab set to chat');
        // Scroll to bottom to show the chat interface
        setTimeout(scrollToBottom, 100);
      }, 100);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle question submission
  const handleQuestionSubmit = async (questionText: string) => {
    if (!questionText.trim() || !docId) return;
    
    // Add user question to messages
    setMessages(prev => [...prev, { text: questionText, isUser: true }]);
    setCurrentQuestion('');
    setIsProcessing(true);
    
    try {
      // Update API endpoint to use the deployed backend URL
      const response = await fetch('https://5000-injzzdag7qrd3e4rzbzg1-b54e9e30.manusvm.computer/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doc_id: docId,
          question: questionText
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add AI response to messages
      setMessages(prev => [
        ...prev, 
        { 
          text: data.answer, 
          isUser: false,
          tokenUsage: data.token_usage,
          relevantSegments: data.relevant_segments
        }
      ]);
      
      // Scroll to bottom after adding new message
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error getting answer:', error);
      setMessages(prev => [
        ...prev, 
        { 
          text: 'Sorry, I encountered an error while processing your question. Please try again.', 
          isUser: false 
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle suggested question click
  const handleSuggestedQuestionClick = (question: string) => {
    handleQuestionSubmit(question);
  };

  // Reset the application
  const handleReset = () => {
    setFile(null);
    setFileName('');
    setDocId('');
    setSuggestedQuestions([]);
    setMessages([]);
    setCurrentQuestion('');
    setUploadTokenUsage(null);
    setActiveTab('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">LegalAssist AI</h1>
            <nav className="flex space-x-4">
              <a href="#" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Home</a>
              <a href="#" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Features</a>
              <a href="#" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">About</a>
              <a href="#" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Contact</a>
              <a href="#" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">FAQ</a>
            </nav>
            {docId ? (
              <button
                onClick={handleReset}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-950 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload New Document
              </button>
            ) : (
              <button
                disabled={!file || isUploading}
                onClick={handleUpload}
                className={`ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                  !file || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-950 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        {activeTab === 'upload' && !docId ? (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="text-center">
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 text-sm font-medium rounded-full mb-4">
                      Intelligent Legal Document Analysis
                    </span>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                      Transform Legal Documents<br />with AI-Powered Insights
                    </h2>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                      Upload your legal documents and get instant analysis, key insights, and
                      answers to your questions using advanced AI technology.
                    </p>
                    
                    <div className="mt-8">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer bg-blue-950 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-md inline-flex items-center transition duration-150 ease-in-out"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Document
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.docx"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                        />
                      </label>
                      <button className="ml-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 border border-gray-300 rounded-md shadow-sm">
                        Learn More
                      </button>
                    </div>
                    
                    {fileName && (
                      <div className="mt-4 text-sm text-gray-600">
                        Selected file: <span className="font-medium">{fileName}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Feature cards */}
                  <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                      <div className="text-yellow-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Analysis</h3>
                      <p className="text-gray-600">
                        Get instant insights and key points from your legal documents.
                      </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                      <div className="text-yellow-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Risk Detection</h3>
                      <p className="text-gray-600">
                        Automatically identify potential legal risks and issues.
                      </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                      <div className="text-yellow-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Answers</h3>
                      <p className="text-gray-600">
                        Ask questions and get immediate answers about your documents.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex flex-col md:flex-row">
                    {/* Suggested questions sidebar */}
                    <div className="w-full md:w-1/3 pr-0 md:pr-6 mb-6 md:mb-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Suggested Questions</h3>
                      <div className="space-y-3">
                        {suggestedQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestedQuestionClick(question)}
                            className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition duration-150 ease-in-out"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                      
                      {uploadTokenUsage && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Document Analysis</h4>
                          <div className="text-xs text-gray-500">
                            <div className="flex justify-between mb-1">
                              <span>Prompt tokens:</span>
                              <span>{uploadTokenUsage.prompt_tokens}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span>Completion tokens:</span>
                              <span>{uploadTokenUsage.completion_tokens}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Total tokens:</span>
                              <span>{uploadTokenUsage.total_tokens}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Chat area */}
                    <div className="w-full md:w-2/3 border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-6">
                      <div className="flex flex-col h-[500px]">
                        <div c
(Content truncated due to size limit. Use line ranges to read in chunks)