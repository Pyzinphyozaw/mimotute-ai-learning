import React, { useState } from 'react';

export default function ChatComponent() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input) return;
    
    setLoading(true);
    setResponse(''); // Clear previous stream

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, mode: 'query' }),
      });

      if (!res.ok) throw new Error('Failed to start stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode incoming binary chunk into string
        buffer += decoder.decode(value, { stream: true });

        // Process completed lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep unfinished line fragment in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const dataStr = trimmed.replace('data: ', '').trim();
              if (dataStr) {
                const parsed = JSON.parse(dataStr);

                // Append new tokens instantly to state
                if (parsed.textResponse) {
                  setResponse((prev) => prev + parsed.textResponse);
                }
              }
            } catch (err) {
              // Ignore partial JSON chunks across frame boundaries
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a question..."
        disabled={loading}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Streaming...' : 'Send'}
      </button>

      <div style={{ marginTop: '20px', whitespace: 'pre-wrap', background: '#f4f4f4', padding: '10px' }}>
        {response || 'Response will render here live...'}
      </div>
    </div>
  );
}