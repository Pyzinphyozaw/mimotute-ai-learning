import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './contexts/AuthContext.jsx';

// 1. Resolve API host domain dynamically based on runtime environment
const NATIVE_BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.97.97:3000';
const BASE_URL = Capacitor.isNativePlatform() ? NATIVE_BACKEND_URL : '';

export default function AiAssistantChat() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  const [chatMessages, setChatMessages] = useState([
    { 
      sender: 'ai', 
      text: "Hello! I am your AI Workspace Assistant. Ask me anything, and let's explore together!" 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query || isSending) return;

    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: query },
      { sender: 'ai', text: '' }
    ]);
    setChatInput('');
    setIsSending(true);

    try {
      // Get auth token from local storage to pass in fetch headers
      const token = localStorage.getItem('token');

      // 2. Use BASE_URL so native Android requests target the backend IP
      const response = await fetch(`${BASE_URL}/api/message/userchat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId, message: query, mode: 'chat' }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from AI.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedAiText = '';
      let buffer = ''; // Buffer for handling partial SSE packet chunks across networks

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Retain incomplete trailing line inside buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.textResponse) {
                accumulatedAiText += parsed.textResponse;

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
              // Ignore invalid or heartbeat comments
            }
          }
        }
      }
    } catch (err) {
      console.error('SSE Stream Error:', err);
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

  const clearChat = () => {
    setChatMessages([
      { sender: 'ai', text: 'Chat reset! How else can I help you today?' }
    ]);
  };

  return (
    <div className="relative flex flex-col h-full w-full max-w-7xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-2xl overflow-hidden transform-gpu font-sans selection:bg-emerald-400 selection:text-slate-950">
      
      {/* Subtle Top Border Glow */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 z-10 transform-gpu">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-teal-500/20">
              <Bot className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-base sm:text-lg tracking-tight text-white">
                AI Intelligence Hub
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1 uppercase tracking-wider">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                Live SSE
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Workspace Active
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <button
          onClick={clearChat}
          title="Reset Chat"
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 transform-gpu active:scale-95 border border-transparent hover:border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Dynamic Chat Messages Viewport */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#0b0f17]/60 transform-gpu">
        {chatMessages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 sm:gap-4 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`relative w-9 h-9 rounded-2xl flex items-center justify-center text-xs shrink-0 shadow-md ${
                  isUser
                    ? 'bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-bold shadow-teal-500/20'
                    : 'bg-slate-900 border border-slate-800 text-teal-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Text Bubble */}
              <div
                className={`relative max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-medium rounded-tr-xs shadow-lg shadow-teal-500/20'
                    : 'bg-slate-900/90 text-slate-100 border border-slate-800 rounded-tl-xs shadow-xl backdrop-blur-md'
                }`}
              >
                {msg.text ? (
                  <p className="whitespace-pre-wrap font-normal">
                    {msg.text}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 py-1 px-1">
                    <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/90 transform-gpu z-10">
        <form 
          onSubmit={handleSendMessage} 
          className="relative flex items-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 focus-within:border-cyan-500/40 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all duration-200"
        >
          <input
            type="text"
            className="w-full bg-transparent px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            placeholder="Ask anything or generate ideas..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isSending}
            autoFocus
          />

          <button
            type="submit"
            disabled={isSending || !chatInput.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-bold shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 transform-gpu"
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <div className="flex items-center justify-between px-2 mt-2 text-[11px] text-slate-400 font-medium">
          <span>Powered by AnythingLLM</span>
          <span>Press Enter to send</span>
        </div>
      </div>

    </div>
  );
}