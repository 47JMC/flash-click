import { Router } from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

import type { UserData } from "../utils/types.js";
import { verifyUser } from "../utils/verifyUser.js";

const authRouter = Router();

type DiscordNameplate = {
  sku_id: string;
  asset: string;
  label: string;
  pallete: string;
};

authRouter.get("/login", (req, res) => {
  const { CLIENT_ID, REDIRECT_URI } = process.env;

  if (!CLIENT_ID || !REDIRECT_URI)
    return res.status(500).json({ error: "Missing env variables" });

  res.redirect(
    `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=identify`,
  );
});

authRouter.get("/callback", async (req, res) => {
  const { CLIENT_ID, CLIENT_SECRET, JWT_SECRET, REDIRECT_URI, FRONTEND_URL } =
    process.env;

  if (
    !CLIENT_ID ||
    !CLIENT_SECRET ||
    !JWT_SECRET ||
    !REDIRECT_URI ||
    !FRONTEND_URL
  )
    return res.status(500).json({
      error:
        "Client ID, Client Secret, JWT Private key, Redirect URI or Frontend URL missing",
    });

  const { code } = req.query;

  if (!code)
    return res.status(400).json({ error: "Authorization code not found" });

  const oauthRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code.toString(),
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!oauthRes.ok)
    return res.status(500).json({ error: "Failed to fetch user info" });

  const { access_token } = await oauthRes.json();

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (!userRes.ok) {
    return res.status(500).json({ error: "Failed to fetch user data" });
  }

  const userInfo = (await userRes.json()) as UserData & {
    collectibles?: { nameplate: DiscordNameplate | null };
  };

  const existingUser = await User.findOne({ id: userInfo.id });

  const avatarUrl = `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}`;

  let nameplateUrl: string | null = null;

  if (userInfo.collectibles && userInfo.collectibles.nameplate)
    nameplateUrl = `https://cdn.discordapp.com/assets/collectibles/${userInfo.collectibles.nameplate.asset}`;

  if (!existingUser) {
    const newUser = new User({
      id: userInfo.id,
      username: userInfo.username,
      global_name: userInfo.global_name,
      avatar: avatarUrl,
      nameplateUrl,
    });

    await newUser.save();
  } else {
    existingUser.username = userInfo.username;
    existingUser.avatar = avatarUrl;
    existingUser.nameplateUrl = nameplateUrl;
    await existingUser.save();
  }

  const token = jwt.sign(
    { id: userInfo.id, avatarUrl, avatar: userInfo.avatar },
    JWT_SECRET,
    {
      expiresIn: "7d",
      algorithm: "HS256",
    },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  res.redirect(FRONTEND_URL);
});

authRouter.get("/me", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Token not found" });
    }

    const user = await verifyUser(token);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default authRouter;
