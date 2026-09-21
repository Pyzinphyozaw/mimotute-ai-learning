//codes in this file are just for test purpose
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BookOpen, HelpCircle, CheckCircle, ArrowLeft, MessageSquare, X, Send } from 'lucide-react';
import { useAuth } from './contexts/AuthContext.jsx';

export default function ChapterContents({ bookId, onBack }) {
  const [chapters, setChapters] = useState([]);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('reading'); // 'reading' | 'qa' | 'quiz'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizAnswers, setQuizAnswers] = useState({});

  // Streaming Text State for Comprehensive Reading
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // AI Chat Sidebar State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! How can I help you analyze this chapter today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchChapters = async () => {
      setLoading(true);
      try {
       const response = await axios.get(`/api/book/all/${bookId}`, {
        withCredentials: true,
      });
        setChapters(response.data.chapters || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load chapter content.');
      } finally {
        setLoading(false);
      }
    };

    if (bookId) fetchChapters();
  }, [bookId]);

  const currentChapter = chapters[selectedChapterIndex];

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Effect for Streaming Reading Text Content on Chapter or Tab Change
  useEffect(() => {
    if (activeTab === 'reading' && currentChapter?.comprehensiveReading) {
      const fullText = currentChapter.comprehensiveReading;
      setDisplayedText('');
      setIsStreaming(true);

      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setDisplayedText((prev) => prev + fullText.charAt(currentIndex));
          currentIndex++;
        } else {
          setIsStreaming(false);
          clearInterval(interval);
        }
      }, 12);

      return () => clearInterval(interval);
    }
  }, [selectedChapterIndex, activeTab, currentChapter]);

  // Real-time SSE Stream Request Handler for AI Chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query || isSending) return;

    // Append User Message & Create Placeholder for AI Streaming Response
    const newMessages = [
      ...chatMessages,
      { sender: 'user', text: query },
      { sender: 'ai', text: '' }
    ];

    setChatMessages(newMessages);
    setChatInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/book/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, message: query, mode: 'chat' }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch streamed response from AI.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedAiText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.textResponse) {
                accumulatedAiText += parsed.textResponse;

                // Update AI chat message bubble dynamically
                setChatMessages((prevMessages) => {
                  const updated = [...prevMessages];
                  updated[updated.length - 1] = {
                    sender: 'ai',
                    text: accumulatedAiText,
                  };
                  return updated;
                });
              }
            } catch (parseError) {
              // Ignore partial JSON boundaries
            }
          }
        }
      }
    } catch (err) {
      setChatMessages((prevMessages) => {
        const updated = [...prevMessages];
        updated[updated.length - 1] = {
          sender: 'ai',
          text: 'Error generating response. Please try again.',
        };
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || chapters.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={onBack} className="btn btn-ghost mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Books
        </button>
        <div className="alert alert-error">{error || 'No chapter data available.'}</div>
      </div>
    );
  }

  return (
    
    <div className="relative min-h-screen flex flex-col">
      <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'pr-0 lg:pr-80' : ''}`}>
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {/* Header & Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="btn btn-outline btn-sm gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            <div className="flex items-center gap-2">
              {/* Toggle AI Chat Sidebar Button */}
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`btn btn-sm gap-2 ${isChatOpen ? 'btn-primary' : 'btn-outline'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isChatOpen ? 'Close Assistant' : 'AI Assistant'}</span>
              </button>

              {/* Chapter Switcher Dropdown */}
              {chapters.length > 1 && (
                <select 
                  className="select select-bordered select-sm"
                  value={selectedChapterIndex}
                  onChange={(e) => setSelectedChapterIndex(Number(e.target.value))}
                >
                  {chapters.map((ch, idx) => (
                    <option key={idx} value={idx}>
                      {ch.chapterTitle || `Chapter ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-extrabold mb-4">{currentChapter.chapterTitle}</h1>

          {/* Navigation Tabs */}
          <div className="tabs tabs-boxed mb-6 bg-base-200 p-1">
            <button 
              className={`tab flex-1 ${activeTab === 'reading' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('reading')}
            >
              <BookOpen className="w-4 h-4 mr-2" /> Comprehensive Reading
            </button>
            <button 
              className={`tab flex-1 ${activeTab === 'qa' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('qa')}
            >
              <HelpCircle className="w-4 h-4 mr-2" /> Questions & Answers ({currentChapter.qa?.length || 0})
            </button>
            <button 
              className={`tab flex-1 ${activeTab === 'quiz' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Practice Quiz ({currentChapter.quiz?.length || 0})
            </button>
          </div>

          {/* Tab 1: Comprehensive Reading with Text Streaming */}
          {activeTab === 'reading' && (
            <div className="card bg-base-100 shadow-xl border border-base-200 p-6">
              <article className="prose max-w-none text-base-content/90 leading-relaxed whitespace-pre-line">
                {displayedText}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
                )}
              </article>
            </div>
          )}

          {/* Tab 2: Questions & Answers */}
          {activeTab === 'qa' && (
            <div className="space-y-4">
              {currentChapter.qa?.map((item, idx) => (
                <div key={idx} className="collapse collapse-plus bg-base-100 border border-base-200 rounded-box shadow-sm">
                  <input type="radio" name="qa-accordion" defaultChecked={idx === 0} />
                  <div className="collapse-title text-md font-semibold text-primary">
                    Q{idx + 1}: {item.question}
                  </div>
                  <div className="collapse-content text-sm text-base-content/80">
                    <p className="p-2 bg-base-200/50 rounded-lg">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Quizzes */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {currentChapter.quiz?.map((q, qIdx) => (
                <div key={qIdx} className="card bg-base-100 border border-base-200 p-6 shadow-sm">
                  <h3 className="font-bold text-lg mb-4">{qIdx + 1}. {q.question}</h3>
                  <div className="space-y-2">
                    {q.options?.map((opt, optIdx) => {
                      const isSelected = quizAnswers[qIdx] === String(optIdx);
                      const isCorrect = String(optIdx) === String(q.correctAnswer);
                      
                      return (
                        <button
                          key={optIdx}
                          onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: String(optIdx) })}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            isSelected 
                              ? isCorrect 
                                ? 'bg-success/20 border-success text-success-content font-medium' 
                                : 'bg-error/20 border-error text-error-content'
                              : 'border-base-300 hover:bg-base-200'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hide-able Right AI Chat Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-base-100 border-l border-base-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-base-200 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-sm">Mimotute AI Chat</h2>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="btn btn-ghost btn-xs btn-circle">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`chat ${msg.sender === 'user' ? 'chat-end' : 'chat-start'}`}>
              <div className={`chat-bubble text-xs ${msg.sender === 'user' ? 'chat-bubble-primary' : 'bg-base-200 text-base-content'}`}>
                {msg.text || (isSending && idx === chatMessages.length - 1 ? <span className="loading loading-dots loading-xs" /> : '')}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-3 border-t border-base-200 bg-base-100 flex gap-2">
          <input
            type="text"
            className="input input-bordered input-sm flex-1 text-xs"
            placeholder="Ask AI about this chapter..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isSending}
          />
          <button type="submit" disabled={isSending} className="btn btn-primary btn-sm btn-square">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </aside>
    </div>
  );
}