import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI with API key from environment variables
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY);

// Use a single fast and reliable model
const MODEL = "gemini-2.5-flash";

// Create the travel plan prompt
const createPrompt = (location, days, traveler, budget) => `
Generate a JSON travel plan for ${location} (${days} days).
Traveler: ${traveler}, Budget: ${budget}.

Rules:
- ${days} hotels (different each day)
- ${days} days itinerary (4-5 activities/day)
- Logical activity order to reduce travel time
- Travel time format: "XX mins from [Previous Place]" or "XX mins from hotel"
- Include realistic distances, prices, coordinates, and image URLs.

JSON only:
{
  "hotels": [
    {
      "hotelName": "...",
      "hotelAddress": "...",
      "price": "...",
      "hotelImageUrl": "...",
      "geoCoordinates": "lat,long",
      "rating": "...",
      "description": "..."
    }
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "plan": [
        {
          "time": "...",
          "placeName": "...",
          "placeDetails": "...",
          "placeImageUrl": "...",
          "geoCoordinates": "lat,long",
          "ticketPricing": "...",
          "timeToTravel": "..."
        }
      ]
    }
  ]
}
`;

// Clean AI response and parse it into JSON
const parseJSON = (text) => {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
};

// Generate travel plan using the AI model
export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const prompt = createPrompt(location, days, traveler, budget);
    const model = genAI.getGenerativeModel({ 
      model: MODEL, 
      generationConfig: { temperature: 0.4, maxOutputTokens: 8192 } 
    });
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  } catch (err) {
    console.error("❌ Error:", err);
    return { hotels: [], itinerary: [] };
  }
};

// Simple AI chat function
export const sendMessage = async (message) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(message);
    return result.response.text();
  } catch {
    return "AI unavailable";
  }
};
