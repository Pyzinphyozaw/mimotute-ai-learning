import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { ENV } from '../lib/env.js';
import Book from '../models/Book.js';
import ChapterContent from '../models/ChapterContent.js';
import Message from '../models/Message.js'

// Helper function to safely parse small JSON responses (Q&A and Quiz)
const parseJSONSafely = (rawText) => {
  try {
    let cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace = cleaned.indexOf('{');
    let lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // 1. Remove trailing commas inside objects/arrays before closing brackets
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

    // 2. Fix unclosed objects before array closing brackets: replace '}' missing before ']'
    cleaned = cleaned.replace(/(\{[^{}]*?)(?=\s*\])/g, (match) => {
      return match.includes('}') ? match : match + '\n  }';
    });

    return JSON.parse(cleaned);
  } catch (err) {
    // Fallback: If strict parsing fails, attempt auto-closing broken structures
    try {
      let repaired = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // Balance unclosed brackets
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;

      if (openBraces > closeBraces) repaired += '}'.repeat(openBraces - closeBraces);
      if (openBrackets > closeBrackets) repaired += ']'.repeat(openBrackets - closeBrackets);

      return JSON.parse(repaired);
    } catch (fallbackErr) {
      console.error('Failed to parse JSON:', err.message);
      return { qa: [], quiz: [] };
    }
  }
};

// Helper function to create configured Axios client
const getAnythingLLMApi = () => {
  const baseURL = 'http://localhost:3001/api/v1';

  return axios.create({
    baseURL,
    headers: {
      'Authorization': 'Bearer TJSMVVM-0314V5V-PYWGKYM-4XCBKY1',
    },
    timeout: 700000, // Extended timeout to handle deep vector processing
  });
};

// Helper function to fetch streamed response from AnythingLLM while piping output to client (if provided)
// and capturing full text output in memory.
const fetchAndStreamLLM = (api, endpoint, payload, res = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await api.post(endpoint, payload, { responseType: 'stream' });
      let accumulatedText = '';

      response.data.on('data', (chunk) => {
        const chunkString = chunk.toString();
        
        // Pipe SSE chunks directly to Express response if streaming to client
        if (res && !res.writableEnded) {
          res.write(chunkString);
        }

        // Parse SSE chunk ("data: {...}\n\n") to aggregate complete string in memory
        const lines = chunkString.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.replace('data: ', '').trim();
              if (jsonStr === '[DONE]') continue;
              const parsed = JSON.parse(jsonStr);
              if (parsed.textResponse) {
                accumulatedText += parsed.textResponse;
              }
            } catch (e) {
              // Ignore partial JSON boundary breaks
            }
          }
        }
      });

      response.data.on('end', () => {
        resolve(accumulatedText);
      });

      response.data.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const pdfSaver = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file attached.' });
  }

  const filePath = req.file.path;
  const userId = req.user?._id || req.body.userId;
  const bookTitle = req.file.originalname;

  try {
    // ---------------------------------------------------------------
    // STEP 0: Check if book already exists for this specific user
    // ---------------------------------------------------------------
    const existingBook = await Book.findOne({ userId, title: bookTitle });

    if (existingBook) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      return res.status(409).json({
        exists: true,
        message: 'Book already exists in your library.',
        book: existingBook,
      });
    }

    // ===============================================================
    // 1. ADD STREAMING HEADERS HERE (Before long RAG operations start)
    // ===============================================================
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flushes initial headers to keep proxy connection alive!

    const sanitizeSlug = (str) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const workspaceSlug = `ws-${userId.toString().slice(-6)}-${sanitizeSlug(bookTitle)}`.slice(0, 30);

    const wspace = workspaceSlug;

    const api = getAnythingLLMApi();

    // Helper function to stream text directly to client terminal window
    const sendStreamLog = (text) => {
      res.write(`data: ${JSON.stringify({ textResponse: text })}\n\n`);
    };

    sendStreamLog(`Starting document setup for ${bookTitle}...\n`);

    // STEP 0.5: Ensure isolated workspace exists
    try {
      await api.post('/workspace/new', { name: workspaceSlug });
      console.log(`✨ Created isolated workspace: ${workspaceSlug}`);
      sendStreamLog(`Created isolated workspace: ${workspaceSlug}\n`);
    } catch (wsError) {
      console.log(` Workspace '${workspaceSlug}' notice: ${wsError.message}`);
    }

    // ---------------------------------------------------------------
    // STEP 1: Upload document to AnythingLLM
    // ---------------------------------------------------------------
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: bookTitle,
      contentType: req.file.mimetype,
    });

    console.log('🚀 Step 1: Uploading document to AnythingLLM...');
    sendStreamLog('Uploading document to vector store...\n');
    const uploadRes = await api.post('/document/upload', formData, {
      headers: { ...formData.getHeaders() },
    });

    if (!uploadRes.data.success || !uploadRes.data.documents?.length) {
      throw new Error(uploadRes.data.error || 'AnythingLLM failed to process document.');
    }

    const docLocation = uploadRes.data.documents[0].location;

    // ---------------------------------------------------------------
    // STEP 2: Embed document into the isolated workspace
    // ---------------------------------------------------------------
    console.log(`🔄 Step 2: Indexing embeddings for workspace: ${workspaceSlug}...`);
    sendStreamLog('Indexing embeddings and vector workspace...\n');
    await api.post(`/workspace/${workspaceSlug}/update-embeddings`, {
      adds: [docLocation],
      deletes: [],
    });

    // Remove local temp upload file immediately after successful AnythingLLM upload
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // ---------------------------------------------------------------
    // STEP 3: Extract chapter outline from isolated workspace (Streamed)
    // ---------------------------------------------------------------
    console.log('🔍 Step 3: Dynamically extracting chapter outline...');
    sendStreamLog('Analyzing document outline...\n');
    const outlinePrompt = `Analyze the uploaded document and divide its entire technical content into EXACTLY 15 logical, sequential learning chapters (Part 1 through Part 15).

STRICT RULES:
1. You MUST generate EXACTLY 15 item titles. No more, no less.
2. Return ONLY a valid JSON array of 15 strings.
3. Example format:
[
"Part 1: Foundations of Software Engineering",
"Part 2: Data Structures & Algorithms",
"Part 3: Object-Oriented Design Patterns",
"Part 4: Clean Code & Refactoring",
"Part 5: Database Systems & Data Modeling",
"Part 6: Systems Architecture & Microservices",
"Part 7: Asynchronous Programming & Concurrency",
"Part 8: Security & Authentication",
"Part 9: DevOps & CI/CD Pipelines",
"Part 10: Performance Tuning & Optimization",
"Part 11: Web Development & API Design",
"Part 12: Memory Management & Garbage Collection",
"Part 13: Functional Programming Principles",
"Part 14: Testing & Quality Assurance",
"Part 15: Cloud Architecture & Serverless Infrastructure"
]
4. Do NOT include any markdown blocks, intro text, or explanation outside the raw JSON array.`;

    const rawOutlineStreamedText = await fetchAndStreamLLM(
      api,
      `/workspace/${workspaceSlug}/stream-chat`,
      { message: outlinePrompt, mode: 'query' }
    );

    let chapterTopics = [];
    try {
      const rawOutlineText = rawOutlineStreamedText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      chapterTopics = JSON.parse(rawOutlineText);
      console.log(`✅ Extracted ${chapterTopics.length} chapters:`, chapterTopics);
      sendStreamLog(`Extracted ${chapterTopics.length} Chapters successfully.\n`);
    } catch (parseError) {
      console.warn('⚠️ Chapter extraction fallback triggered.');
      chapterTopics = [
        "Part 1: Introduction and Foundations",
        "Part 2: Core Concepts and Implementation",
        "Part 3: Advanced Topics and Applications",
        "Part 4: Architecture and Optimization"
      ];
    }

    // ---------------------------------------------------------------
    // STEP 4: Generate chapter content using isolated workspace (Streamed)
    // ---------------------------------------------------------------
    console.log('📚 Step 4: Generating deep long-form chapter content...');
    const processedChapters = [];

    for (const topic of chapterTopics) {
      console.log(`⏳ Processing: ${topic}...`);
      sendStreamLog(`Generating reading content for: ${topic}...\n`);

      // 4a. Comprehensive Reading Generation
      const readingPrompt = `You are an expert technical textbook author and tutor for me, write a comprehensive study section on "${topic}" and teaching me step by step. Write a detailed, well-ordered multi-paragraph reading parts that covers all core technical concepts. Return raw plain text only.`;

      const rawReadingStreamedText = await fetchAndStreamLLM(
        api,
        `/workspace/${workspaceSlug}/stream-chat`,
        { message: readingPrompt, mode: 'query' }
      );

      const comprehensiveReading = rawReadingStreamedText.trim();

      // 4b. Code Block Generation (Safely Handled)
      sendStreamLog(`Extracting code examples for: ${topic}...\n`);
      const codePrompt = `You are an expert technical textbook author and tutor. 
Provide practical, well-commented code examples for "${topic}" if "${topic}" involves programming or practical code configuration.

STRICT RULES:
1. Always format code using standard Markdown code blocks with language identifiers (e.g. \`\`\`javascript or \`\`\`python).
2. Do NOT wrap output inside JSON objects or JSON strings.
3. If "${topic}" does not involve programming or code execution, return a short note stating "No code required for this conceptual topic."`;

      const rawCodeStreamedText = await fetchAndStreamLLM(
        api,
        `/workspace/${workspaceSlug}/stream-chat`,
        { message: codePrompt, mode: 'query' }
      );

      // Sanitize extracted code string to eliminate syntax escaping crashes
      const cleanCodeExamples = rawCodeStreamedText
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .trim();

      // 4c. Q&A and Quiz Generation
      sendStreamLog(`Generating Q&A & Quiz for: ${topic}...\n`);
      const qaQuizPrompt = `
Based on "${topic}", create 5 Question & Answer pairs and 3 multiple-choice quiz questions.

CRITICAL INSTRUCTIONS:
- Output MUST be strictly valid JSON without syntax errors.
- Ensure every item inside arrays is fully closed with its own closing brace '}'.
- Return ONLY JSON matching this format:

{
  "qa": [
    { "question": "Q1", "answer": "A1" }
  ],
  "quiz": [
    { "question": "Quiz 1", "options": ["A", "B", "C", "D"], "correctAnswer": 0 }
  ]
}`;
      const rawQaQuizStreamedText = await fetchAndStreamLLM(
        api,
        `/workspace/${workspaceSlug}/stream-chat`,
        { message: qaQuizPrompt, mode: 'query' }
      );
      console.log(rawQaQuizStreamedText);

      const structuredData = parseJSONSafely(rawQaQuizStreamedText);
      console.log(structuredData);

      const chapterData = {
        chapterTitle: topic,
        comprehensiveReading: comprehensiveReading,
        codeExamples: cleanCodeExamples, // NEW: Added code blocks output
        qa: structuredData.qa || [],
        quiz: structuredData.quiz || []
      };

      processedChapters.push(chapterData);
      console.log(`✅ Fully saved chapter without parsing errors: ${topic}`);
    }
    console.log('🎉 Course generation complete!', processedChapters);
    sendStreamLog('Finishing database records creation...\n');

    // ---------------------------------------------------------------
    // STEP 5: SAVE TO DATABASE (Only executed if everything above succeeds)
    // ---------------------------------------------------------------
    const savedBook = await Book.create({
      userId: userId,
      title: bookTitle,
      cover: '',
      workspace: wspace,
    });

    const newChapterContent = await ChapterContent.create({
      userId: userId,
      bookId: savedBook._id,
      chapter: processedChapters.length,
      ChapterContent: processedChapters,
    });
    console.log(`💾 Saved to MongoDB with ID: ${newChapterContent._id}`);

    // ===============================================================
    // 2. END STREAM WRITES ACCORDINGLY
    // ===============================================================
    sendStreamLog('Book processing completed successfully!\n');
    res.write('data: [DONE]\n\n');
    return res.end();

  } catch (error) {
    console.error('❌ RAG Pipeline Error:', error.response?.data || error.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // If headers already sent via text/event-stream, output error over stream and end
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ textResponse: `\nError: ${error.message}` })}\n\n`);
      return res.end();
    }

    return res.status(500).json({
      error: 'Failed to process book pipeline.',
      details: error.response?.data || error.message,
    });
  }
};

export const askQuestion = async (req, res) => {
  const { bookId, message, mode = 'chat' } = req.body;
  const userId = req.user?._id || req.body.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing.' });
  }

  if (!bookId) {
    return res.status(400).json({ error: 'bookId parameter is required.' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message parameter is required.' });
  }

  try {
    // 1. Fetch book to get its specific AnythingLLM workspace slug
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const workspaceSlug = book.workspace;

    if (!workspaceSlug) {
      return res.status(400).json({ error: 'No workspace configured for this book.' });
    }

    // 2. Save user message to database immediately
    await Message.create({
      userId,
      bookId,
      sender: 'user',
      message: message.trim(),
    });

    const api = getAnythingLLMApi();

    // Headers required for Server-Sent Events (SSE) stream back to React
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 3. Stream SSE response to frontend while collecting full text response in memory
    const fullAnswer = await fetchAndStreamLLM(
      api,
      `/workspace/${workspaceSlug}/stream-chat`,
      { message, mode },
      res
    );

    // 4. Save AI generated response message to database
    if (fullAnswer && fullAnswer.trim()) {
      await Message.create({
        userId,
        bookId,
        sender: 'ai',
        message: fullAnswer.trim(),
      });
    }

    res.end();

  } catch (error) {
    console.error('❌ Chat Error:', error.response?.data || error.message);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to answer question.',
        details: error.response?.data || error.message,
      });
    } else {
      res.end();
    }
  }
};
// 1. Controller to fetch existing history
export const getChatHistory = async (req, res) => {
  const userId=req.user._id;
  const bookId= req.params.bookId; // Pass as query params
  console.log(userId);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing.' });
  }

  try {
    const filter = { userId };
    if (bookId) filter.bookId = bookId; // Optional: filter by book if provided
    console.log('filter :',filter)
    // Query messages sorted chronologically
    const history = await Message.find(filter)
      .sort({ createdAt: 1 })
      .select('sender message -_id');

    // Format for React state shape { sender, text }
    const formattedHistory = history.map((msg) => ({
      sender: msg.sender,
      text: msg.message,
    }));
    console.log('History',formattedHistory)
    return res.status(200).json(formattedHistory);
  } catch (error) {
    console.error('❌ Fetch History Error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch chat history.' });
  }
};


export const converse = async (req, res) => {

  console.log('converse function is working!')
  const { message, mode = 'chat' } = req.body;
  console.log(message);
  const userId = req.user?._id || req.body.userId;
  console.log(userId);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing.' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message parameter is required.' });
  }

  try {
    // Generate a unique workspace slug using the user's ID
    const api=getAnythingLLMApi();
    // 1. Ensure the user-specific workspace exists in AnythingLLM

    // 2. Save user message to database
    await Message.create({
      userId,
      sender: 'user',
      message: message.trim(),
    });

    // Headers required for Server-Sent Events (SSE) stream
    // Add explicitly before fetchAndStreamLLM call
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache, no-transform'); // Added no-transform
res.setHeader('Connection', 'keep-alive');
res.setHeader('X-Accel-Buffering', 'no'); // Disables Nginx/Proxy buffering
res.flushHeaders?.(); // Flush headers immediately if middleware supports it

    // 3. Stream SSE response to frontend while collecting full text response
    const fullAnswer = await fetchAndStreamLLM(
      api,
      `/workspace/user-6a8c0e36dc44cb37b0f10839/stream-chat`,
      { message, mode },
      res
    );

    // 4. Save AI generated response message to database
    if (fullAnswer && fullAnswer.trim()) {
      await Message.create({
        userId,
        sender: 'ai',
        message: fullAnswer.trim(),
      });
    }

    res.end();

  } catch (error) {
    console.error('❌ Chat Error:', error.response?.data || error.message);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to answer question.',
        details: error.response?.data || error.message,
      });
    } else {
      res.end();
    }
  }
};

export const getallbooksbyuserid = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User ID missing' });
    }

    const books = await Book.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    console.error('❌ Error fetching user books:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve books',
      error: error.message,
    });
  }
};


export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.aggregate([
      // 1. Sort by creation date descending so the newest book for each title comes first
      { $sort: { createdAt: -1 } },
      
      // 2. Group by unique title and keep the first document encountered
      {
        $group: {
          _id: '$title',
          bookDoc: { $first: '$$ROOT' }
        }
      },
      
      // 3. Promote the grouped document back to the top level
      { $replaceRoot: { newRoot: '$bookDoc' } },
      
      // 4. Sort the distinct list by creation date descending again
      { $sort: { createdAt: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    console.error('❌ Error fetching unique books:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve books',
      error: error.message,
    });
  }
};
// Adjust path to match your folder structure

export const addToLibrary = async (req, res) => {
  try {
    const { bookId } = req.body;
    const currentUserId = req.user?._id || req.user?.id; // Extracted from auth middleware

    if (!bookId) {
      return res.status(400).json({ message: 'Book ID is required.' });
    }

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized. User session not found.' });
    }

    // 1. Fetch original book by ID
    const existingBook = await Book.findById(bookId).lean();

    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    // 2. Prevent duplication if the user already owns this specific book
    if (existingBook.userId.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: 'This book is already existed in your library.' });
    }

    // 3. Duplicate the Book document for the new user
    const { _id: originalBookId, createdAt, updatedAt, ...bookData } = existingBook;

    const newBook = new Book({
      ...bookData,
      userId: currentUserId,
    });

    const savedBook = await newBook.save();

    // 4. Fetch all ChapterContent documents linked to the original bookId
    const existingChapters = await ChapterContent.find({ bookId: originalBookId }).lean();

    // 5. Duplicate ChapterContent documents with currentUserId & savedBook._id
    if (existingChapters.length > 0) {
      const newChapters = existingChapters.map((ch) => {
        const { _id, createdAt, updatedAt, ...chapterData } = ch;
        return {
          ...chapterData,
          userId: currentUserId,
          bookId: savedBook._id,
        };
      });

      await ChapterContent.insertMany(newChapters);
    }

    return res.status(201).json({
      message: 'Book and its chapters copied to your library successfully.',
      book: savedBook,
    });
  } catch (error) {
    console.error('Error duplicating book and chapters:', error);
    return res.status(500).json({ message: 'Server error while processing library addition.' });
  }
};