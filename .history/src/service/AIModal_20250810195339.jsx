import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Use a single reliable model
const MODEL = "gemini-2.5-flash";

const config = {
  temperature: 0.4,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// Create the travel plan prompt
const createPrompt = (location, days, traveler, budget) => `
Create travel plan for ${location} with EXACTLY ${days} days.

Requirements:
- Traveler: ${traveler}, Budget: ${budget}
- ${days} hotels (different each day)
- ${days} days itinerary (4-5 activities/day)
- Logical order to minimize travel time

JSON format only:
{
  "hotels": [
    {"hotelName": "Name", "hotelAddress": "Address", "price": "$XX/night", "hotelImageUrl": "url", "geoCoordinates": "lat,lng", "rating": "X.X", "description": "text"}
  ],
  "itinerary": [
    {"day": "Day 1", "plan": [{"time": "9:00 AM", "placeName": "Name", "placeDetails": "Details", "placeImageUrl": "url", "geoCoordinates": "lat,lng", "ticketPricing": "$XX", "timeToTravel": "XX mins"}]}
  ]
}
`;

// Clean and parse JSON
const parseJSON = (text) => {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
};

// Generate travel plan
export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    console.log(`🚀 Generating ${days} days for ${location}`);
    const prompt = createPrompt(location, days, traveler, budget);

    const model = genAI.getGenerativeModel({ model: MODEL, generationConfig: config });
    const result = await model.generateContent(prompt);

    return parseJSON(result.response.text());
  } catch (error) {
    console.error("🔥 Generation failed:", error);
    return { hotels: [], itinerary: [] };
  }
};

// Simple chat function
export const sendMessage = async (message) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(message);
    return result.response.text();
  } catch {
    return "AI currently unavailable";
  }
};
