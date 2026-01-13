import { GoogleGenAI } from "@google/genai";
import { CommentaryRequest } from "../types";

const SYSTEM_INSTRUCTION = `
You are an energetic, hype-filled Taiwanese basketball commentator (like a mix of passionate NBA anchors). 
Your output must be in Traditional Chinese (Taiwan).
Keep it extremely short, punchy, and fun (under 20 words).
React to the player's shot immediately.
If they miss, roast them gently or encourage them.
If they score, hype it up!
If they have a streak, go crazy!
`;

let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

export const generateCommentary = async (data: CommentaryRequest): Promise<string> => {
  try {
    const ai = getClient();
    
    let prompt = "";
    if (data.lastShot.made) {
      prompt = `Player Scored! Streak: ${data.streak}. ${data.lastShot.isClean ? "It was a clean swish!" : "It rattled in."}`;
    } else {
      prompt = `Player Missed. Streak reset. ${data.lastShot.isAirball ? "It was an embarrassing airball." : "Hit the rim/backboard and missed."}`;
    }
    
    // Using gemini-3-flash-preview for speed/latency which is critical for a game
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.2, // High creativity/randomness
        maxOutputTokens: 50,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    return response.text || "好球！";
  } catch (error) {
    console.error("Gemini commentary failed", error);
    // Fallback phrases if API fails or key is missing
    const fallbacks = ["加油！再試一次！", "可惜啊！", "水啦！空心入網！", "這球太神了！"];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};