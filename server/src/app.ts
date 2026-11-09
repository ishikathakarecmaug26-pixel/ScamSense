import express from "express";
import cookieParser from "cookie-parser"; //need for jwt auth
import cors from "cors";
import { env } from "./config/env.js"; //need for cors client url

import authRoutes from "./routes/authRoutes.js"; // our authentication routes
import articleRoutes from "./routes/articleRoutes.js"; // educational articles routes
import quizRoutes from "./routes/quizRoutes.js"; // quiz and questions routes
import contactRoutes from "./routes/contactRoutes.js"; // user contact & inquiry routes
import { analyzeRouter, scanRouter } from "./routes/scanRoutes.js"; // scam analyzer & scan history routes
import { getUserQuizAttempts } from "./controllers/quizController.js"; // user quiz attempts
import { authenticate } from "./middleware/authMiddleware.js"; // auth middleware

import { Request, Response, NextFunction } from "express";

const app = express(); //creating the express app

//middlewares exe order

app.use(express.json({ limit: "20kb" })); //need js obj so this parses json req and kept the limit to 20kb cuz json req body shouldnt be big or its a bot or hacker

app.use(cookieParser()); //same parsing but from req header we need the cookie and then attach to req obj
//cors
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

//if client url is missing from allowed origin we have to add it in array
if (env.CLIENT_URL && !allowedOrigins.includes(env.CLIENT_URL)) {
  allowedOrigins.push(env.CLIENT_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Cors is blocked for origin ${origin}`));
      }
    },
    credentials: true,
  })
);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
//health check route
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ScamSense API is running",
  });
});

//mounting auth routes
//post register,login,logout
//get me (profile)
app.use("/api/auth", authRoutes);

//mounting article routes
//get articles and specific articles using :id
//post,put,delete for admin 
app.use("/api/articles", articleRoutes);


//mounting quiz routes
//get quizzes , specific quizzes admin quizzes user attempts
//post user attempt admin new quiz new questions
//put quiz and question by admin
//delete admin
app.use("/api/quizzes", quizRoutes);

//quiz endpoint handler
app.get("/api/quiz-attempts", authenticate, getUserQuizAttempts);


//mountingconatct routes
//post any one public
//get,delete admin only
app.use("/api/contact", contactRoutes);

//mounting scanner analyzer routes

app.use("/api/analyze", analyzeRouter);
app.use("/api/scans", scanRouter);


//error handler middleware

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Error:", err.message);
  console.error(err.stack); // prints error stack
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server. Please try again later.",
  });
});

export default app;