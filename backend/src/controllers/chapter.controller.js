import ChapterContent from '../models/ChapterContent.js';

export const getBookChapters = async (req, res) => {
  try {
    const { bookId } = req.params;
    console.log(bookId);
    const userId = req.user._id;
    console.log(userId);

    // Search by both bookId and userId for security
    const chapterData = await ChapterContent.findOne({ bookId, userId });

    if (!chapterData) {
      return res.status(404).json({ success: false, message: 'No content found for this book.' });
    }

    return res.status(200).json({
      success: true,
      chapters: chapterData.ChapterContent // Returns array of chapters containing qa, quiz, etc.
    });
  } catch (error) {
    console.error('Error fetching chapter content:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching chapters.' });
  }
};

export const getBookChaptersall = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    // Search by both bookId and userId for security
    const chapterData = await ChapterContent.find({ bookId});

    if (!chapterData) {
      return res.status(404).json({ success: false, message: 'No content found for this book.' });
    }

    return res.status(200).json({
      success: true,
      chapters: chapterData.ChapterContent // Returns array of chapters containing qa, quiz, etc.
    });
  } catch (error) {
    console.error('Error fetching chapter content:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching chapters.' });
  }
};