import dotenv from "dotenv";
dotenv.config()

export const ENV= {
PORT: process.env.PORT,
MONGO_URI: process.env.MONGO_URI,
NODE_ENV: process.env.NODE_ENV,
JWT_SECRET: process.env.JWT_SECRET,
RESEND_API_KEY: process.env.RESEND_API_KEY,
EMAIL_FROM: process.env.EMAIL_FROM,
EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
CLIENT_URL: process.env.CLIENT_URL,
CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
ANYTHINGLLM_URL :process.env.ANYTHINGLLM_URL,
API_KEY :process.env.API_KEY,
WORKSPACE_SLUG :process.env.WORKSPACE_SLUG,
}