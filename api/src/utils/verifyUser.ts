import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function verifyUser(token: string) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) throw new Error("JWT_SECRET not set");

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      avatar: string;
    };
    const user = await User.findOne({ id: decoded.id }).lean();
    return user ?? null;
  } catch {
    return null;
  }
}
