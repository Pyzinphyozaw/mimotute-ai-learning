import mongoose from "mongoose";

const chapterContentSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
        index:true
    },
    bookId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        index:true
    },
    chapter:{
        type:Number,
        min:1,
        max:30,
        index: true,
    },
    ChapterContent:{
        type:Array,
        required:true,
    }
},{timestamps:true})

const ChapterContent=mongoose.model('ChapterContent',chapterContentSchema)

export default ChapterContent