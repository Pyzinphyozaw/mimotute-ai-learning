import mongoose, { Schema } from 'mongoose';

const bookSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Use string 'User' here
      required: true, // Recommended over unique if a user can upload multiple books
    },
    title: {
      type: String, // Native String type (without quotes)
      required: true,
    },
    cover: {
      type: String, // Native String type
      default: '',
    },
    workspace:{
      type:String,
      required:true,
    }
  },
  { timestamps: true }
);

const Book = mongoose.model('Book', bookSchema);
export default Book;