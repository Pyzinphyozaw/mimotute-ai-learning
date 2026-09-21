import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  let token = req.cookies?.jwt;

  console.log(req.headers);
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(400).json({ message: "Unauthorized user." });

  try {
    const decode = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decode.userId).select("-password");
    if (!user) return res.status(400).json({ message: "Invalid user" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Unauthorized user." });
  }
};