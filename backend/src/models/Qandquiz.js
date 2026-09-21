import mongoose from "mongoose";

const qandquizSchema=new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    qanda:{
        type:Array,
    },
    quiz: {
        type: Array,
    }
},{timestamps: true})

const Qandquiz=mongoose.model('Qandquiz',qandquizSchema);

export default Qandquiz;