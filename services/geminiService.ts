
import { GoogleGenAI, Type } from "@google/genai";
import { Habit, HabitLog } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHabitInsights = async (habits: Habit[], logs: HabitLog[]): Promise<any> => {
  const prompt = `
    Analyze these habits and completion logs:
    Habits: ${JSON.stringify(habits)}
    Logs: ${JSON.stringify(logs)}
    
    Provide coaching insights. Identify patterns, streaks, and areas for improvement. 
    Be encouraging but data-driven.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A brief summary of current progress." },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Actionable tips based on the data." 
            },
            encouragement: { type: Type.STRING, description: "A motivational quote or message." }
          },
          required: ["summary", "recommendations", "encouragement"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const suggestNewHabits = async (goals: string): Promise<any> => {
  const prompt = `Based on these goals: "${goals}", suggest 3 SMART habits to track. Include a single appropriate emoji for each.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              frequency: { type: Type.STRING },
              emoji: { type: Type.STRING, description: "A single emoji that represents the habit." }
            },
            required: ["name", "description", "category", "frequency", "emoji"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};
