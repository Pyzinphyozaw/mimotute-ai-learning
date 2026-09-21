import ChapterContent from '../models/ChapterContent.js'; // Adjust paths as needed
import Qandquiz from '../models/Qandquiz.js';

export const populateUserQandQuiz = async (req, res) => {
  try {
    // 1. Get userId from request body or authenticated user session
    const userId = req.body.userId || req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // 2. Fetch all ChapterContent documents matching the specified userId
    const userChapterDocs = await ChapterContent.find({ userId }).lean();

    if (!userChapterDocs || userChapterDocs.length === 0) {
      // Optional: Delete stale Qandquiz record if no ChapterContent exists anymore
      await Qandquiz.deleteMany({ userId });
      return res.status(404).json({ message: 'No chapter content found for this user.' });
    }

    // 3. Aggregate all `qa` and `quiz` arrays across all chapters freshly
    const combinedQa = [];
    const combinedQuiz = [];

    userChapterDocs.forEach((doc) => {
      if (Array.isArray(doc.ChapterContent)) {
        doc.ChapterContent.forEach((chapter) => {
          if (Array.isArray(chapter.qa) && chapter.qa.length > 0) {
            combinedQa.push(...chapter.qa);
          }
          if (Array.isArray(chapter.quiz) && chapter.quiz.length > 0) {
            combinedQuiz.push(...chapter.quiz);
          }
        });
      }
    });

    // 4. Wipe out any previous record and insert the fresh set of data
    // findOneAndReplace replaces the whole document structure for the matched query
    const updatedQandquiz = await Qandquiz.findOneAndReplace(
      { userId },
      { 
        userId,
        qanda: combinedQa,
        quiz: combinedQuiz,
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      message: 'Successfully reset and populated Qandquiz records from chapter contents.',
      data: updatedQandquiz,
    });
  } catch (error) {
    console.error('Error populating QandQuiz model:', error);
    return res.status(500).json({ message: 'Server error while populating Qandquiz document.' });
  }
};