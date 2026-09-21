import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import multer from "multer";
import { getChatHistory,addToLibrary,pdfSaver,askQuestion, getallbooksbyuserid,getAllBooks } from "../controllers/book.controller.js";
import { getBookChaptersall,getBookChapters } from '../controllers/chapter.controller.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploaded-pdfs');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.use(protectRoute)
router.post('/upload', upload.single('pdfFile'), pdfSaver);
router.post('/chat', askQuestion); 
router.get('/chat/history/:bookId', getChatHistory);
router.get('/books', getAllBooks); 
router.get('/userbooks', getallbooksbyuserid); 
router.get('/test', (req,res)=>res.send('Yes')); 
router.get('/:bookId', getBookChapters);
router.get('/all/:bookId', getBookChaptersall);
router.post('/addtolib', addToLibrary);
//router.post('/changeProfile',changeProfile)

export default router