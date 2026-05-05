import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are MindEase AI, a compassionate and supportive mental wellness chatbot. 
Your goal is to provide emotional support, listen without judgment, and help users manage stress, anxiety, and daily challenges.
Use a calming, empathetic, and professional tone. 
Always prioritize user safety. If a user expresses intent to harm themselves or others, provide crisis resources immediately.
Avoid giving medical advice or diagnoses. 
Keep responses concise but warm.
Incorporate wellness techniques like mindfulness, grounding (5-4-3-2-1), and deep breathing when appropriate.`;

export async function chatWithAI(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    return response.text || "I'm here for you, but I'm having trouble thinking of a response right now. Could you tell me more?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm experiencing some technical difficulties. Please know that I'm still here for you.";
  }
}
