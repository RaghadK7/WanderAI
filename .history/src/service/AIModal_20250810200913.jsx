import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

const cleanJSON = (text) => {
  let cleaned = text.trim().replace(/json/gi, '').replace(//g, '').replace(/^json/i, '').trim();
  const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error("No valid JSON found");
  return JSON.parse(cleaned.substring(start, end + 1));
};

const tryAllModels = async (prompt, retries = 2) => {
  for (const m of MODELS) {
    for (let i = 1; i <= retries; i++) {
      try {
        const res = await genAI.getGenerativeModel({ model: m }).generateContent(prompt);
        return res.response.text();
      } catch (err) {
        if (err.status === 503) await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
  throw new Error("All models failed");
};

const createPrompt = (location, days, traveler, budget) => `
Create travel plan for ${location}. Generate EXACTLY ${days} days, no exceptions.

Requirements:
- Traveler: ${traveler}, Budget: ${budget}
- Generate ${days} hotels minimum
- Each day: 4-5 activities with times
- All ${days} days must be included

JSON format:
{
  "hotels": [
    {"hotelName": "Name", "hotelAddress": "Address", "price": "$XX/night", "hotelImageUrl": "url", "geoCoordinates": "lat,lng", "rating": "X.X", "description": "text"}
  ],
  "itinerary": [
    {"day": "Day 1", "plan": [{"time": "9:00 AM", "placeName": "Name", "placeDetails": "Details", "placeImageUrl": "url", "geoCoordinates": "lat,lng", "ticketPricing": "$XX", "timeToTravel": "XX mins"}]}
  ]
}

Generate all ${days} days now:`;

const forceDays = async (location, current, target) => {
  const missing = target - current;
  const prompt = `Generate EXACTLY ${missing} more days for ${location}. Start from Day ${current + 1} to Day ${target}.

JSON array format:
[
  {"day": "Day ${current + 1}", "plan": [{"time": "9:00 AM", "placeName": "Place", "placeDetails": "Details", "placeImageUrl": "url", "geoCoordinates": "lat,lng", "ticketPricing": "$XX", "timeToTravel": "XX mins"}]}
]`;
  try {
    return JSON.parse((await tryAllModels(prompt)).trim().replace(/json/gi, '').replace(//g, '').trim());
  } catch {
    return [];
  }
};

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const parsed = cleanJSON(await tryAllModels(createPrompt(location, days, traveler, budget)));
    if ((parsed.itinerary?.length || 0) < days) {
      parsed.itinerary = [...(parsed.itinerary || []), ...(await forceDays(location, parsed.itinerary?.length || 0, days))];
    }
    return parsed;
  } catch {
    return {
      hotels: [{ hotelName: "Generation Failed", hotelAddress: "Please try again", price: "N/A", geoCoordinates: "0,0", rating: "0", description: "AI unavailable" }],
      itinerary: [{ day: "Day 1", plan: [{ time: "Error", placeName: "Generation Failed", placeDetails: "Please try again", geoCoordinates: "0,0" }] }]
    };
  }
};

export const sendMessage = async (prompt) => {
  try {
    for (const m of MODELS) {
      try {
        const res = await genAI.getGenerativeModel({ model: m }).generateContent(prompt);
        return res.response.text();
      } catch {}
    }
    throw new Error();
  } catch {
    return "AI currently unavailable";
  }
};