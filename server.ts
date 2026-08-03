import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini Client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "ProEdit Studio" });
  });

  // AI Subtitle Generation Endpoint
  app.post("/api/ai/subtitles", async (req, res) => {
    try {
      const { clipDescription, duration = 10, language = "English" } = req.body;
      const ai = getGeminiClient();

      const prompt = `Generate realistic, synchronized subtitles/captions in ${language} for a video described as: "${clipDescription || "general video clip"}". 
Total duration is ${duration} seconds.
Provide a JSON array of subtitle segments with timing. Format:
[
  { "start": 0.5, "end": 2.5, "text": "Welcome to ProEdit Studio!" },
  { "start": 3.0, "end": 5.5, "text": "Transforming your videos with AI." }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.NUMBER, description: "Start time in seconds" },
                end: { type: Type.NUMBER, description: "End time in seconds" },
                text: { type: Type.STRING, description: "Subtitle caption text" },
              },
              required: ["start", "end", "text"],
            },
          },
        },
      });

      const text = response.text || "[]";
      const subtitles = JSON.parse(text);
      res.json({ success: true, subtitles });
    } catch (error: any) {
      console.error("AI Subtitles Error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate subtitles" });
    }
  });

  // AI Scene Detection Endpoint
  app.post("/api/ai/scene-detect", async (req, res) => {
    try {
      const { duration = 30, description = "Action sequence video" } = req.body;
      const ai = getGeminiClient();

      const prompt = `Perform AI scene detection for a ${duration}-second video clip described as "${description}".
Identify logical scene cut points where the clip should be automatically split.
Return a JSON array of cut timestamps in seconds (between 0 and ${duration}).
Example: [4.2, 11.5, 18.0]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
          },
        },
      });

      const text = response.text || "[]";
      const cuts = JSON.parse(text);
      res.json({ success: true, cuts });
    } catch (error: any) {
      console.error("AI Scene Detect Error:", error);
      res.status(500).json({ error: error?.message || "Failed to detect scenes" });
    }
  });

  // AI Auto Color Correction Endpoint
  app.post("/api/ai/color-correct", async (req, res) => {
    try {
      const { mood = "vivid cinematic" } = req.body;
      const ai = getGeminiClient();

      const prompt = `Provide optimal professional color grading values for a video scene wanting a "${mood}" look.
Return JSON with numeric brightness (-50 to +50), contrast (-50 to +50), saturation (-50 to +50), exposure (-50 to +50), and recommended LUT preset name ('vintage' | 'cyberpunk' | 'film' | 'bw' | 'warm' | 'cool' | 'vivid').`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brightness: { type: Type.NUMBER },
              contrast: { type: Type.NUMBER },
              saturation: { type: Type.NUMBER },
              exposure: { type: Type.NUMBER },
              lutPreset: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["brightness", "contrast", "saturation", "exposure", "lutPreset"],
          },
        },
      });

      const text = response.text || "{}";
      const colorGrade = JSON.parse(text);
      res.json({ success: true, colorGrade });
    } catch (error: any) {
      console.error("AI Color Correct Error:", error);
      res.status(500).json({ error: error?.message || "Failed color correction" });
    }
  });

  // AI Text to Speech Voiceover Endpoint
  app.post("/api/ai/tts", async (req, res) => {
    try {
      const { text, voice = "Kore" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text prompt is required for TTS" });
      }

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || "Kore" },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ success: true, base64Audio, mimeType: "audio/pcm" });
      } else {
        res.status(500).json({ error: "No audio data returned from Gemini TTS" });
      }
    } catch (error: any) {
      console.error("AI TTS Error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate TTS voiceover" });
    }
  });

  // AI Auto-Highlight / Reel Generator Endpoint
  app.post("/api/ai/highlights", async (req, res) => {
    try {
      const { clipsCount = 3, targetDuration = 15, theme = "energetic" } = req.body;
      const ai = getGeminiClient();

      const prompt = `Generate a smart video highlight montage configuration for ${clipsCount} video clips to fit a ${targetDuration}-second reel with a ${theme} mood.
Return JSON with key segment timestamps to keep, recommended speed multipliers (e.g. 1.2x, 1.5x), and transition styles between segments.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              highlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    clipIndex: { type: Type.INTEGER },
                    start: { type: Type.NUMBER },
                    duration: { type: Type.NUMBER },
                    speed: { type: Type.NUMBER },
                    transition: { type: Type.STRING },
                  },
                },
              },
              summary: { type: Type.STRING },
            },
          },
        },
      });

      const text = response.text || "{}";
      const result = JSON.parse(text);
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("AI Highlights Error:", error);
      res.status(500).json({ error: error?.message || "Failed highlight generation" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ProEdit Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
