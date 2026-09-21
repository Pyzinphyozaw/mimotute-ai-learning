import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChapterStream() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStream = async () => {
    setContent('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/chapter', {
  credentials: 'include',
});

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk and update state immediately
        const chunk = decoder.decode(value, { stream: true });
        setContent((prev) => prev + chunk);
      }

      // Flush remaining bytes at the end of stream
      const remainingChunk = decoder.decode();
      if (remainingChunk) {
        setContent((prev) => prev + remainingChunk);
      }
    } catch (err) {
      setError(err.message || 'Failed to stream content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStream();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chapter Content</h1>
        <button
          onClick={fetchStream}
          disabled={loading}
          className="btn btn-primary btn-sm"
        >
          {loading ? 'Streaming...' : 'Reload Stream'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl border border-base-300 p-6">
        <article className="prose max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-base-200 px-1 py-0.5 rounded" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        {loading && (
          <div className="flex items-center gap-2 mt-4 text-sm text-base-content/60">
            <span className="loading loading-dots loading-sm"></span>
            Streaming live data...
          </div>
        )}
      </div>
    </div>
  );
}