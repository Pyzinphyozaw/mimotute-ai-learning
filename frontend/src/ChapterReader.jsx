import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, HelpCircle, CheckCircle, ArrowLeft, MessageSquare, X, Send, Code, Terminal, Play, Pause } from 'lucide-react';

// ---------------------------------------------------------------
// utils/markdownToPlain.js (inlined for a single-file drop-in)
// ---------------------------------------------------------------
export function markdownToPlain(md) {
  if (!md) return '';
  let text = md;

  // Remove fenced code blocks entirely (Piper shouldn't read code aloud)
  text = text.replace(/```[\s\S]*?```/g, ' ');
  // Inline code: keep content, drop backticks
  text = text.replace(/`([^`]+)`/g, '$1');
  // Links: [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Images: drop entirely
  text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ');
  // Headings: strip leading #
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Bold / italic
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  // Bullets -> comma pause
  text = text.replace(/^\s*[-*+]\s+/gm, ', ');
  // Numbered lists -> comma pause
  text = text.replace(/^\s*\d+\.\s+/gm, ', ');
  // Blockquotes
  text = text.replace(/^\s*>\s?/gm, '');
  // Horizontal rules
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, ' ');
  // Collapse newlines
  text = text.replace(/\n{2,}/g, '. ');
  text = text.replace(/\n/g, ' ');
  // Cleanup
  text = text.replace(/\s{2,}/g, ' ');
  text = text.replace(/\s+([,.!?;:])/g, '$1');
  text = text.replace(/([,.!?;:])\1+/g, '$1');

  return text.trim();
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------
export default function ChapterReader({ bookId, onBack }) {
  const [chapters, setChapters] = useState([]);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('reading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizAnswers, setQuizAnswers] = useState({});

  // Streaming text state
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Chat sidebar state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! How can I help you analyze this chapter today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  // Audio playback state
  const audioRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');

  // Prevent repeated auto-play for the same chapter
  const autoPlayedRef = useRef(null);

  // Fetch chapters
  useEffect(() => {
    const fetchChapters = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/book/${bookId}`);
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

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`/api/book/chat/history/${bookId}`);
        if (response.data && response.data.length > 0) {
          setChatMessages(response.data);
        }
      } catch (err) {
        console.error('Failed to load past chat messages:', err);
      }
    };
    if (bookId) fetchChatHistory();
  }, [bookId]);

  // Cleanup audio on chapter change / unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
    };
  }, [selectedChapterIndex]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  };

  // ---------------------------------------------------------------
  // Streaming effect
  // Streams the RAW markdown text one slice at a time so the user
  // sees the same content they'd see in the final render. We do not
  // render ReactMarkdown mid-stream (it chokes on partial syntax).
  // ---------------------------------------------------------------
  useEffect(() => {
    stopAudio();
    if (activeTab === 'reading' && currentChapter?.comprehensiveReading) {
      const fullText = currentChapter.comprehensiveReading;
      setDisplayedText('');
      setIsStreaming(true);

      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < fullText.length) {
          const chunk = fullText.slice(currentIndex, currentIndex + 3);
          setDisplayedText((prev) => prev + chunk);
          currentIndex += 3;
        } else {
          setIsStreaming(false);
          clearInterval(interval);
        }
      }, 12);

      return () => clearInterval(interval);
    }
  }, [selectedChapterIndex, activeTab, currentChapter]);

  // ---------------------------------------------------------------
  // Play / pause chapter audio
  // ---------------------------------------------------------------
  const handleSpeakChapter = async (fromAutoPlay = false) => {
    // Pause if currently playing
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsSpeaking(false);
      return;
    }

    // Resume if paused
    if (audioRef.current && audioRef.current.paused && audioRef.current.src) {
      try {
        await audioRef.current.play();
        setIsSpeaking(true);
      } catch (e) {
        // Autoplay was blocked on resume too — surface hint
        setAudioError('Click anywhere on the page to enable audio.');
      }
      return;
    }

    // Otherwise: fetch fresh audio
    const textToSpeak = markdownToPlain(
      currentChapter?.comprehensiveReading || displayedText
    );
    if (!textToSpeak) return;

    setIsAudioLoading(true);
    setAudioError('');

    try {
      const response = await fetch('http://localhost:5000/piper-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audio.preload = 'auto';
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setAudioError('Audio playback failed.');
      };

      try {
        await audio.play();
        setIsSpeaking(true);
        setAudioError('');
      } catch (playErr) {
        // Browsers block autoplay until user interaction.
        if (playErr.name === 'NotAllowedError' && fromAutoPlay) {
          setAudioError('Autoplay blocked. Click anywhere to start audio.');
        } else if (playErr.name === 'NotAllowedError') {
          setAudioError('Please click the Listen button to start audio.');
        } else {
          throw playErr;
        }
      }
    } catch (err) {
      console.error('TTS error:', err);
      setAudioError(err.message || 'Could not generate speech.');
    } finally {
      setIsAudioLoading(false);
    }
  };

  // ---------------------------------------------------------------
  // Auto-play once per chapter after streaming completes
  // ---------------------------------------------------------------
  useEffect(() => {
    if (
      activeTab === 'reading' &&
      currentChapter?.comprehensiveReading &&
      !isStreaming &&
      autoPlayedRef.current !== selectedChapterIndex
    ) {
      autoPlayedRef.current = selectedChapterIndex;
      const t = setTimeout(() => {
        handleSpeakChapter(true); // true => autoplay context
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, activeTab, selectedChapterIndex, currentChapter]);

  // ---------------------------------------------------------------
  // Global "first user interaction" listener
  // If autoplay was blocked, the very next click anywhere retries it.
  // ---------------------------------------------------------------
  useEffect(() => {
    const unlock = () => {
      if (audioRef.current && audioRef.current.paused && audioRef.current.src) {
        audioRef.current.play().then(() => {
          setIsSpeaking(true);
          setAudioError('');
        }).catch(() => {});
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // ---------------------------------------------------------------
  // Chat streaming
  // ---------------------------------------------------------------
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query || isSending) return;

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

      if (!response.ok) throw new Error('Failed to fetch streamed response from AI.');

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
                setChatMessages((prevMessages) => {
                  const updated = [...prevMessages];
                  updated[updated.length - 1] = { sender: 'ai', text: accumulatedAiText };
                  return updated;
                });
              }
            } catch (parseError) { /* partial JSON */ }
          }
        }
      }
    } catch (err) {
      setChatMessages((prevMessages) => {
        const updated = [...prevMessages];
        updated[updated.length - 1] = { sender: 'ai', text: 'Error generating response. Please try again.' };
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  };

  // ---------------------------------------------------------------
  // Code example rendering
  // ---------------------------------------------------------------
  const highlightSyntax = (codeStr) => {
    return codeStr.split('\n').map((line, lineIdx) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('<!--')) {
        return <span key={lineIdx} className="text-slate-500 italic">{line}{'\n'}</span>;
      }
      const tokens = line.split(/(\s+|[(){}<>;,=])/);
      return (
        <span key={lineIdx}>
          {tokens.map((token, tokIdx) => {
            if (/^(public|private|protected|class|static|void|import|package|new|return|int|String|boolean)$/.test(token)) {
              return <span key={tokIdx} className="text-purple-400 font-semibold">{token}</span>;
            }
            if (/^(xmlns|xsi|schemaLocation|id|class)$/.test(token)) {
              return <span key={tokIdx} className="text-sky-300">{token}</span>;
            }
            if (/^".*"$/.test(token)) {
              return <span key={tokIdx} className="text-emerald-300">{token}</span>;
            }
            if (/^\d+$/.test(token)) {
              return <span key={tokIdx} className="text-amber-300">{token}</span>;
            }
            return token;
          })}
          {'\n'}
        </span>
      );
    });
  };

  const renderCodeExamples = (codeExamplesText) => {
    if (!codeExamplesText) return null;
    const cleanedText = codeExamplesText.trim();
    const blockRegex = /(?:```([a-zA-Z0-9_-]+)?\r?\n([\s\S]*?)```)|(?:^(xml|java|python|javascript|js|html|css|sql|json)\r?\n([\s\S]*?)(?=(?:\r?\n\r?\n(?:xml|java|python|javascript|js|html|css|sql|json)\r?\n)|$))/gim;

    const codeBlocks = [];
    let match;
    while ((match = blockRegex.exec(cleanedText)) !== null) {
      const language = match[1] || match[3] || 'code';
      const content = (match[2] || match[4] || '').trim();
      if (content) codeBlocks.push({ language: language.toLowerCase(), content });
    }

    if (codeBlocks.length === 0) {
      const sections = cleanedText.split(/\n\s*\n/);
      sections.forEach((sec) => {
        const lines = sec.trim().split('\n');
        const firstLine = lines[0].trim().toLowerCase();
        if (['xml', 'java', 'python', 'javascript', 'js', 'html', 'css', 'json'].includes(firstLine)) {
          codeBlocks.push({ language: firstLine, content: lines.slice(1).join('\n').trim() });
        } else {
          codeBlocks.push({ language: 'code', content: sec.trim() });
        }
      });
    }

    return (
      <div className="space-y-6 mt-4">
        {codeBlocks.map((block, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2 font-semibold tracking-wide">
                <Terminal className="w-4 h-4 text-indigo-400" />
                {block.language.toUpperCase()} EXAMPLE
              </span>
            </div>
            <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed bg-slate-950">
              <code>{highlightSyntax(block.content)}</code>
            </pre>
          </div>
        ))}
      </div>
    );
  };

  // ---------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="btn btn-outline btn-sm gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`btn btn-sm gap-2 ${isChatOpen ? 'btn-primary' : 'btn-outline'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isChatOpen ? 'Close Assistant' : 'AI Assistant'}</span>
              </button>

              {chapters.length > 1 && (
                <select
                  className="select select-bordered select-sm"
                  value={selectedChapterIndex}
                  onChange={(e) => {
                    stopAudio();
                    setSelectedChapterIndex(Number(e.target.value));
                  }}
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

          {/* Chapter title + Listen button */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <h1 className="text-3xl font-extrabold">{currentChapter.chapterTitle}</h1>
            <button
              onClick={() => handleSpeakChapter(false)}
              disabled={isAudioLoading}
              className={`btn btn-sm gap-2 ${isSpeaking ? 'btn-error' : 'btn-primary'}`}
            >
              {isAudioLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Generating...
                </>
              ) : isSpeaking ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Listen
                </>
              )}
            </button>
          </div>

          {audioError && (
            <div className="alert alert-warning text-xs py-2 mb-4">{audioError}</div>
          )}

          {/* Tabs */}
          <div className="tabs tabs-boxed mb-6 bg-base-200 p-1">
            <button className={`tab flex-1 ${activeTab === 'reading' ? 'tab-active' : ''}`} onClick={() => setActiveTab('reading')}>
              <BookOpen className="w-4 h-4 mr-2" /> Reading
            </button>
            <button className={`tab flex-1 ${activeTab === 'qa' ? 'tab-active' : ''}`} onClick={() => setActiveTab('qa')}>
              <HelpCircle className="w-4 h-4 mr-2" /> Q&A
            </button>
            <button className={`tab flex-1 ${activeTab === 'quiz' ? 'tab-active' : ''}`} onClick={() => setActiveTab('quiz')}>
              <CheckCircle className="w-4 h-4 mr-2" />Quizzes
            </button>
          </div>

          {/* Reading tab */}
          {activeTab === 'reading' && (
            <div className="space-y-6">
              <div className="card bg-base-100 shadow-xl border border-base-200 p-6">
                {/*
                  While streaming: ReactMarkdown safely parses partial markdown
                  (it just renders whatever tags are closed so far). This means
                  bold text, headings, and bullets appear formatted as they
                  arrive, not as raw `**` characters.
                */}
                <article className="prose prose-slate max-w-none text-base-content/90 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {isStreaming ? displayedText : (currentChapter.comprehensiveReading || '')}
                  </ReactMarkdown>
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" />
                  )}
                </article>
              </div>

              {currentChapter.codeExamples && (
                <div className="card bg-base-100 shadow-xl border border-base-200 p-6">
                  <div className="flex items-center gap-2 mb-4 border-b border-base-200 pb-3">
                    <Code className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-bold">Code Examples & Implementation</h2>
                  </div>
                  {renderCodeExamples(currentChapter.codeExamples)}
                </div>
              )}
            </div>
          )}

          {/* Q&A tab */}
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

          {/* Quiz tab */}
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

      {/* AI Chat Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-80 bg-base-100 border-l border-base-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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