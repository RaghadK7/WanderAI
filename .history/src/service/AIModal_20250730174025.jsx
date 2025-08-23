import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

const config = {
  temperature: 0.3,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const createPrompt = (location, days, traveler, budget) => {
  return `Generate EXACTLY ${days} days travel plan for ${location}. Budget: ${budget}, Type: ${traveler}.

CRITICAL: Return ${days} days only. No more, no less.

JSON format:
{
  "hotels": [{"hotelName": "", "hotelAddress": "", "price": "", "hotelImageUrl": "", "geoCoordinates": "", "rating": "", "description": ""}],
  "itinerary": [
    {"day": "Day 1", "plan": [{"time": "9:00 AM", "placeName": "", "placeDetails": "", "placeImageUrl": "", "geoCoordinates": "", "ticketPricing": "", "timeToTravel": ""}]}
  ]
}

Generate all ${days} days:`;
};

const tryModel = async (prompt) => {
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (error.status === 503) await new Promise(r => setTimeout(r, 2000));
      continue;
    }
  }
  throw new Error("All models failed");
};

const parseJSON = (text) => {
  const cleaned = text.trim()
    .replace(/```json|```/g, '')
    .replace(/^json/i, '');
  
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) throw new Error("Invalid JSON");
  
  return JSON.parse(cleaned.substring(start, end + 1));
};

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const prompt = createPrompt(location, days, traveler, budget);
    const response = await tryModel(prompt);
    const parsed = parseJSON(response);
    
    const generated = parsed.itinerary?.length || 0;
    console.log(`Generated: ${generated}/${days} days`);
    
    // Force complete if missing days
    if (generated < days) {
      const missing = days - generated;
      const continuePrompt = `Add ${missing} more days to complete ${days} days total. Continue from Day ${generated + 1} to Day ${days}. JSON array format: [{"day": "Day X", "plan": [...]}]`;
      
      try {
        const extra = await tryModel(continuePrompt);
        const extraDays = JSON.parse(extra.trim().replace(/```json|```/g, ''));
        if (Array.isArray(extraDays)) {
          parsed.itinerary = [...(parsed.itinerary || []), ...extraDays];
        }
      } catch (e) {
        console.warn("Failed to add missing days");
      }
    }
    
    return parsed;
  } catch (error) {
    console.error("Generation failed:", error);
    return null;
  }
};

export const chatSession = {
  sendMessage: async (prompt) => {
    const model = genAI.getGenerativeModel({ model: MODELS[0] });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
};

export const sendMessage = async (prompt) => {
  try {
    return await chatSession.sendMessage(prompt);
  } catch (error) {
    return await tryModel(prompt);
  }
};