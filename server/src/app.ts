import express from "express";

const app = express();

// Middleware 
app.use(express.json({ limit: "20kb" }));

// Health check route
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ScamSense API is running",
  });
});

export default app;
