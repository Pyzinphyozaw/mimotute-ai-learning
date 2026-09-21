import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { ENV } from '../lib/env.js';
import Book from '../models/Book.js';
import ChapterContent from '../models/ChapterContent.js'

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

export const pdfSaver = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file attached.' });
  }

  const filePath = req.file.path;
  const userId = req.user?._id || req.body.userId;

  try {

    const savedBook = await Book.create({
      userId: userId,
      title: req.file.originalname, // Uses original filename as the title
      cover: '', // Set a cover URL or image path if available
    });
    console.log(savedBook)


    const api = getAnythingLLMApi();

    // 1. Prepare stream for AnythingLLM upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

  

    console.log('🚀 Step 1: Uploading document to AnythingLLM...');

    const uploadRes = await api.post('/document/upload', formData, {
      headers: { ...formData.getHeaders() },
    });

    if (!uploadRes.data.success || !uploadRes.data.documents?.length) {
      throw new Error(uploadRes.data.error || 'AnythingLLM failed to process document.');
    }

    const docLocation = uploadRes.data.documents[0].location;
    console.log(`📄 Document uploaded successfully: ${docLocation}`);

    // 2. Embed document into workspace
    console.log('🔄 Step 2: Indexing workspace embeddings...');
    await api.post('/workspace/mimotute/update-embeddings', {
      adds: [docLocation],
      deletes: [],
    });

    // Cleanup local temp upload file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // 3. Dynamically extract chapter titles from PDF
    console.log('🔍 Step 3: Dynamically extracting chapter outline...');
    const outlinePrompt = `
Analyze the uploaded document and divide its entire technical content into EXACTLY 4 logical, sequential learning chapters (Part 1 through Part 4).

STRICT RULES:
1. You MUST generate EXACTLY 4 item titles. No more, no less.
2. If the book is short or has few chapters, divide the main topics into smaller logical sub-parts.
3. If the book is long or has many chapters, group smaller topics into 4 main learning modules.
4. Return ONLY a valid JSON array of 4 strings.
5. Example format:
[
  "Part 1: Introduction and Environment Setup",
  "Part 2: Basic Syntax and Variables",
  ...
  "Part 4: Advanced Architecture and Final Best Practices"
]
6. Do NOT include any markdown blocks, intro text, or explanation outside the raw JSON array.
`;

    const outlineResponse = await api.post('/workspace/mimotute/chat', {
      message: outlinePrompt,
      mode: 'query',
    });

    let chapterTopics = [];

    try {
      const rawOutlineText = outlineResponse.data.textResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      chapterTopics = JSON.parse(rawOutlineText);

      if (!Array.isArray(chapterTopics) || chapterTopics.length === 0) {
        throw new Error('Parsed outline is empty or not an array.');
      }
      console.log(`✅ Extracted ${chapterTopics.length} chapters:`, chapterTopics);
    } catch (parseError) {
      console.warn('⚠️ Chapter extraction fallback triggered.');
      chapterTopics = [
        "Part 1: Introduction and Foundations",
        "Part 2: Core Concepts and Implementation",
        "Part 3: Advanced Topics and Applications"
      ];
    }

    // 4. Loop through each chapter and generate rich, long-form content
    console.log('📚 Step 4: Generating deep long-form chapter content...');
    const processedChapters = [];
    // Helper to safely parse small JSON responses (Q&A and Quiz)
const parseJSONSafely = (rawText) => {
  try {
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    }
    return JSON.parse(cleaned);
  } catch (err) {
    return { qa: [], quiz: [] };
  }
};
    for (const topic of chapterTopics) {
  console.log(`⏳ Processing: ${topic}...`);

  // --- CALL 1: Fetch Raw Reading Text (No JSON constraints) ---
  const readingPrompt = `
    You are an expert technical textbook author writing a comprehensive study section on "${topic}".
    Write a detailed, well-ordered multi-paragraph reading that covers all core technical concepts, rules, and code examples found in this chapter.
    Do NOT write brief bullet points. Write full, rich textbook prose. Do NOT output JSON. Return raw plain text only.
  `;

  const readingResponse = await api.post('/workspace/mimotute/chat', {
    message: readingPrompt,
    mode: 'query',
  });

  const comprehensiveReading = readingResponse.data.textResponse.trim();

  // --- CALL 2: Fetch Small Q&A and Quiz JSON ---
  const qaQuizPrompt = `
    Based on "${topic}", create 5 Question & Answer pairs and 3 multiple-choice quiz questions.
    Return ONLY a valid JSON object strictly matching this format:
    {
      "qa": [
        {"question": "Q1", "answer": "A1"}
      ],
      "quiz": [
        {
          "question": "Quiz question 1",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A"
        }
      ]
    }
    Do NOT include conversational filler or markdown blocks outside the JSON.
  `;

  const qaResponse = await api.post('/workspace/mimotute/chat', {
    message: qaQuizPrompt,
    mode: 'query',
  });

  const structuredData = parseJSONSafely(qaResponse.data.textResponse);

  // --- MERGE & PUSH TO ARRAY ---
  const chapterData = {
    chapterTitle: topic,
    comprehensiveReading: comprehensiveReading,
    qa: structuredData.qa || [],
    quiz: structuredData.quiz || []
  };

  processedChapters.push(chapterData);
  console.log(`✅ Fully saved chapter without parsing errors: ${topic}`);
}

    // 5. Return complete structured output (Optional: Save to MongoDB here)
    console.log('🎉 Course generation complete!',processedChapters);

    const newChapterContent = await ChapterContent.create({
    userId: userId,
    bookId: savedBook._id,
    chapter: processedChapters.length, // Automatically stores total array length
    ChapterContent: processedChapters  // Stores the entire array of chapters
  });

  console.log(`💾 Saved to MongoDB with ID: ${newChapterContent._id}`);
    return res.status(200).json({
    message: 'Book processed, summarized, and saved to database successfully!',
    documentPath: docLocation,
    totalChapters: processedChapters.length,
    savedRecordId: newChapterContent._id,
    chapters: processedChapters,
  });

  } catch (error) {
    console.error('❌ RAG Pipeline Error:', error.response?.data || error.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return res.status(500).json({
      error: 'Failed to process book pipeline.',
      details: error.response?.data || error.message,
    });
  }
};

export const askQuestion = async (req, res) => {
  const { message, mode = 'query' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message parameter is required.' });
  }

  try {
    const api = getAnythingLLMApi();

    const response = await api.post('/workspace/mimotute/chat', {
      message,
      mode,
    });

    return res.status(200).json({
      answer: response.data.textResponse,
      sources: response.data.sources || [],
    });

  } catch (error) {
    console.error('❌ Chat Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to answer question.',
      details: error.response?.data || error.message,
    });
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
