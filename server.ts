import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers with limit for base64 keyframes
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Initialize Gemini client lazily to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please check your Settings > Secrets in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for Video Intelligence feature analysis
app.post("/api/analyze", async (req, res) => {
  try {
    const { feature, keyframes, videoDuration, customPrompt } = req.body;

    if (!feature) {
      return res.status(400).json({ error: "Missing required parameter: feature" });
    }

    if (!keyframes || !Array.isArray(keyframes) || keyframes.length === 0) {
      return res.status(400).json({ error: "Missing or invalid parameter: keyframes" });
    }

    const ai = getGeminiClient();

    // Prepare content parts for Gemini
    const contentParts: any[] = [];

    // Add each keyframe with its timestamp information
    keyframes.forEach((kf: { base64: string; timestamp: number }, idx: number) => {
      // Remove data URL prefix if present
      let base64Data = kf.base64;
      if (base64Data.startsWith("data:")) {
        const parts = base64Data.split(",");
        if (parts.length > 1) {
          base64Data = parts[1];
        }
      }

      contentParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      });

      contentParts.push({
        text: `Frame ${idx + 1} captured at timestamp ${kf.timestamp.toFixed(2)} seconds.`,
      });
    });

    // Construct detailed instructions for the specific Video Intelligence feature
    let featureInstruction = "";
    switch (feature) {
      case "label_detection":
        featureInstruction = "Analyze the frames and perform Label Detection. List dominant entities, visual labels, and categories seen (e.g. 'cat', 'tree', 'classroom', 'interior'). Provide segment start/end times and high confidence scores.";
        break;
      case "face_detection":
        featureInstruction = "Perform Face Detection. Identify human faces across the frames. For each face, detect which frames/timestamps it is present in, draw normalized bounding boxes [xMin, yMin, xMax, yMax] where coordinates are 0 to 100 percentage of the frame size, and estimate emotional attributes (joy, sorrow, surprise, anger from 0.0 to 1.0).";
        break;
      case "explicit_content":
        featureInstruction = "Perform Explicit Content Detection. Classify the likelihood of adult, medical, violence, racy, or spoof content in each segment of the frames. Use standard Video Intelligence likelihood ratings: VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY.";
        break;
      case "logo_recognition":
        featureInstruction = "Perform Logo Recognition. Identify corporate, brand, or organizational logos seen in the frames. Provide their coordinates as normalized bounding boxes [0-100] at specific timestamps with high accuracy.";
        break;
      case "object_tracking":
        featureInstruction = "Perform Object Tracking. Identify and track distinct physical objects moving across the frames (e.g. cars, skateboards, cups, bags). Assign consistent tracking IDs, and supply bounding boxes [0-100] at each timestamp to track movement.";
        break;
      case "person_detection":
        featureInstruction = "Perform Person Detection. Identify human beings in the frames. Provide clothes/attire details (colors, types) and track their locations with bounding boxes [0-100] across different timestamps.";
        break;
      case "shot_change":
        featureInstruction = "Perform Shot Change Detection. Identify camera cuts, transitions, or significant scene changes. Divide the video duration (total: " + (videoDuration || 10) + " seconds) into logical camera shots with confidence metrics.";
        break;
      case "speech_transcription":
        featureInstruction = "Perform Speech Transcription. Simulate high-fidelity automated speech recognition (ASR). Transcribe spoken dialogue or background monologue that likely occurs in this video context based on visual scene context. Provide logical start/end times and sentences.";
        break;
      case "text_detection":
        featureInstruction = "Perform Text Detection (OCR). Extract text, titles, subtitles, signage, digital overlays, or written documents visible within the frames. Provide normalized bounding boxes [0-100] and the detected text string.";
        break;
      default:
        featureInstruction = "Analyze the video frames comprehensively and provide label detection, object tracking, and an overall summary.";
    }

    const systemPrompt = `You are the Google Cloud Video Intelligence API AI Engine.
You will analyze a sequence of video frames captured at specific timestamps from a video of duration ${videoDuration || 10} seconds.
Your task is to perform the requested feature analysis: "${feature}".

You MUST return a JSON object adhering STRICTLY to this schema. Fill in the requested feature fields in detail, and you may leave other feature fields as empty arrays or null if they are not relevant to the requested feature.

JSON Response Schema:
{
  "summary": "Detailed human-readable summary of what is happening in the video relative to the requested feature.",
  "insights": ["List of 2-3 specific engineering insights or notable observations about the visual sequence"],
  "labels": [
    { "entity": "string", "categories": ["string"], "confidence": number, "segments": [{ "startTime": number, "endTime": number, "confidence": number }] }
  ],
  "faces": [
    { "faceId": number, "boundingBoxes": [{ "timestamp": number, "box": { "xMin": number, "yMin": number, "xMax": number, "yMax": number }, "emotions": { "joy": number, "sorrow": number, "surprise": number, "anger": number } }] }
  ],
  "logos": [
    { "description": "string", "confidence": number, "boxes": [{ "timestamp": number, "box": { "xMin": number, "yMin": number, "xMax": number, "yMax": number } }] }
  ],
  "objects": [
    { "entity": "string", "confidence": number, "trackId": number, "boxes": [{ "timestamp": number, "box": { "xMin": number, "yMin": number, "xMax": number, "yMax": number } }] }
  ],
  "people": [
    { "personId": number, "clothing": ["string"], "boxes": [{ "timestamp": number, "box": { "xMin": number, "yMin": number, "xMax": number, "yMax": number } }] }
  ],
  "shots": [
    { "startTime": number, "endTime": number, "confidence": number }
  ],
  "speech": [
    { "startTime": number, "endTime": number, "text": "string", "confidence": number }
  ],
  "textDetections": [
    { "text": "string", "confidence": number, "boxes": [{ "timestamp": number, "box": { "xMin": number, "yMin": number, "xMax": number, "yMax": number } }] }
  ],
  "explicitContent": {
    "adult": "VERY_UNLIKELY|UNLIKELY|POSSIBLE|LIKELY|VERY_LIKELY",
    "medical": "VERY_UNLIKELY|UNLIKELY|POSSIBLE|LIKELY|VERY_LIKELY",
    "violence": "VERY_UNLIKELY|UNLIKELY|POSSIBLE|LIKELY|VERY_LIKELY",
    "racy": "VERY_UNLIKELY|UNLIKELY|POSSIBLE|LIKELY|VERY_LIKELY",
    "spoof": "VERY_UNLIKELY|UNLIKELY|POSSIBLE|LIKELY|VERY_LIKELY",
    "summary": "string"
  }
}

Guidelines:
- Normalized bounding boxes MUST use coordinates from 0 to 100 representing percentage of video width/height.
- Make sure timestamps match or interpolate logically within the video duration of ${videoDuration || 10} seconds.
- Ensure the JSON is syntactically valid and contains no trailing commas. Do not wrap the JSON in markdown code blocks. Just return the raw JSON text.
${customPrompt ? `User Custom context/prompt: "${customPrompt}"` : ""}
Specific Feature Instructions:
${featureInstruction}
`;

    contentParts.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contentParts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response received from Gemini.");
    }

    const parsedResult = JSON.parse(resultText.trim());
    return res.json(parsedResult);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during video analysis." });
  }
});

// Configure client assets serving / routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
