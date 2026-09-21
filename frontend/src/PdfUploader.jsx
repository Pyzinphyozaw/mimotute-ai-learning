import { useState } from "react";
import axios from 'axios';

export default function PdfUploader() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0] || null);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setStatus({ type: 'error', message: 'Please select a file first.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);

    try {
      const response = await axios.post(
        '/api/book/upload', 
        formData, 
        {
          withCredentials: true, // <-- Automatically attaches the JWT cookie
        }
      );

      setStatus({ type: 'success', message: 'File uploaded successfully!' });
      console.log('Upload response:', response.data);
    } catch (error) {
      console.error('Upload failed:', error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Upload failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <form onSubmit={handleUpload} className="space-y-4">
        {status.message && (
          <div className={`p-3 rounded text-sm ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {status.message}
          </div>
        )}

        <input 
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={loading}
          className="file-input file-input-bordered w-full"
        />

        <button 
          type="submit" 
          disabled={loading || !selectedFile}
          className="btn btn-primary w-full"
        >
          {loading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </form>
    </div>
  );
}