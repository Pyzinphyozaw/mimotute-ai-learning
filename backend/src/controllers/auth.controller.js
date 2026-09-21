import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
//import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import "dotenv/config";
import jwt from 'jsonwebtoken';

export const checkUser = (req, res, next) => {
  // Assuming you store the JWT in a cookie named 'token' during login
  const token = req.cookies.token; 

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach { _id: "..." } to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};


export const signup=async (req, res)=>{
    const {fullname,email,password}= req.body;

    try{
        //check all fields entered
        if(!fullname || !email || !password){
           return res.status(400).json({message:"All fields required"});
        }

        //check password valid
        if(password.length < 6){
            return res.status(400).json({message:"Password must be at least 6 characters"});
        }

        //check email valid
        const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({message:"Invalid email format"});
        }

        const user= await User.findOne({email});
        if(user) return res.status(400).json({message:"User already exists, Login instead"});

        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);
    
        
        const newUser=new User({
            fullname,
            email,
            password:hashedPassword,
        });

        if(newUser){
            //save the user to the database and send data response
            const savedUser=await newUser.save();
            generateToken(savedUser._id,res);
            res.status(201).json({
                message: "Account created successfully",
                _id:newUser._id,
                fullname:newUser.fullname,
                email:newUser.email,
                profilePic:newUser.profilePic,
            });

            // try{
            //     await sendWelcomeEmail(savedUser.email,savedUser.fullname,process.env.CLIENT_URL);
            // }
            // catch(error){
            //     console.error("Failed to send welcome email", error);
            // }
        }
        else{
            res.status(500).json({message: "Oops! Something went wrong."});
        }
    }
    catch(error){
        console.error("SOmething went wrong!",error);
    }
}

export const login=async (req, res) =>{
  const {email,password}=req.body;
  console.log(email);
  if(!email || !password) return res.status(400).json({message: "All fields are required"});
    try{
    const user=await User.findOne({email});

    if(!user) return res.status(400).json({message: "Email or password is worng"});
   
    const isPwCorrect=await bcrypt.compare(password, user.password);
    if(!isPwCorrect) return res.status(400).json({message: "Email or password is worng"});

    const token=generateToken(user._id,res);

    res.status(201).json({
                message: "Logged in successfully",
                 token: token,
                _id: user._id,
                fullname: user.fullname,
                email:user. email,
                profilePic: user.profilePic,
            });
}
    catch(error){
        console.error("Error in LoginController");
        res.status(500).json({message: "Internal server error"});
    }
}

export const logout=async (_, res) => {
  res.cookie("jwt", "" , {maxAge:0});
  res.status(200).json({message: "Logged out."})
}

export const changeProfile = async (req, res) => {
  try {
    const { userId, profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required!" });
    }

    // 1. Upload base64/file path to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(profilePic);

    // 2. Update MongoDB user record with image URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResult.secure_url },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    // 3. Return updated user object
    res.status(200).json({
      _id: updatedUser._id,
      fullname: updatedUser.fullname,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
    });
  } catch (error) {
    console.error("Profile change error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};