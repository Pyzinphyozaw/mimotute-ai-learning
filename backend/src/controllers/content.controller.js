// Step 1: Ask AnythingLLM/Llama 3.1 to extract the chapter outline
console.log('🔍 Step 1: Dynamically extracting chapter titles from PDF...');

const outlinePrompt = `
Analyze the uploaded document's Table of Contents or main structure.
Identify all primary chapters or major learning modules in this book.

STRICT INSTRUCTIONS:
1. Return ONLY a valid JSON array of strings containing the chapter names.
2. Example output format: ["Chapter 1: Title Here", "Chapter 2: Title Here", "Chapter 3: Title Here"]
3. Do NOT include any markdown blocks, conversational text, or explanation.
`;

const outlineResponse = await api.post(`/workspace/${ENV.WORKSPACE_SLUG}/chat`, {
  message: outlinePrompt,
  mode: 'query', // Strictly use document context to find the Table of Contents
});

let chapterTopics = [];

try {
  // Clean raw AI response from possible markdown backticks (```json ... ```)
  const rawOutlineText = outlineResponse.data.textResponse
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  chapterTopics = JSON.parse(rawOutlineText);

  // Fallback safety check if the model didn't return an array
  if (!Array.isArray(chapterTopics) || chapterTopics.length === 0) {
    throw new Error('AI output was not a valid non-empty array.');
  }

  console.log(`✅ Extracted ${chapterTopics.length} chapters dynamically:`, chapterTopics);

} catch (parseError) {
  console.warn('⚠️ Dynamic chapter extraction failed or returned invalid JSON. Using fallback topics.');
  // Safe fallback if the PDF lacks a clear Table of Contents
  chapterTopics = [
    "Part 1: Introduction and Core Concepts",
    "Part 2: Main Syntax and Practical Guide",
    "Part 3: Advanced Topics and Best Practices"
  ];
}

// Step 2: Now run your loop over the dynamically retrieved array
for (const topic of chapterTopics) {
  console.log(`⏳ Generating deep long-form content for: ${topic}...`);
  
  // Send your specialized long-form prompt for this topic...
}