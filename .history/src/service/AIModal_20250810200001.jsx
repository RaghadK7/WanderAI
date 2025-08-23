import { GoogleGenerativeAI } from "@google/generative-ai";

// ====== CONFIG ======
const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const MODEL = "gemini-2.5-flash";
const config = {
  temperature: 0.4,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// ====== INIT ======
const genAI = new GoogleGenerativeAI(apiKey);

// ====== PROMPT CREATOR ======
const createPrompt = (location, days, traveler, budget) => `
Create a travel plan for ${location} with EXACTLY ${days} days.

Requirements:
- Traveler: ${traveler}
- Budget: ${budget}
- ${days} hotels (different each day)
- ${days} days itinerary (4-5 activities/day)
- Logical activity order to minimize travel time
- All travel times realistic and formatted: "XX mins from [Previous Place]" or "XX mins from hotel"

Return ONLY valid JSON in this format:
{
  "hotels": [
    {
      "hotelName": "Name",
      "hotelAddress": "Address",
      "price": "$XX/night",
      "hotelImageUrl": "url",
      "geoCoordinates": "lat,lng",
      "rating": "X.X",
      "description": "text"
    }
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "plan": [
        {
          "time": "9:00 AM",
          "placeName": "Name",
          "placeDetails": "Details",
          "placeImageUrl": "url",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "$XX",
          "timeToTravel": "XX mins"
        }
      ]
    }
  ]
}
`;

// ====== SAFE JSON PARSER ======
const parseJSON = (text) => {
  if (!text) return { hotels: [], itinerary: [] };
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return { hotels: [], itinerary: [] };
  try {
    return JSON.parse(cleaned.substring(start, end + 1));
  } catch {
    return { hotels: [], itinerary: [] };
  }
};

// ====== MAIN FUNCTION ======
export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const prompt = createPrompt(location, days, traveler, budget);
    const model = genAI.getGenerativeModel({ model: MODEL, generationConfig: config });
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  } catch {
    return {
      hotels: [{
        hotelName: "Generation Failed",
        hotelAddress: "Please try again",
        price: "N/A",
        hotelImageUrl: "",
        geoCoordinates: "0,0",
        rating: "0",
        description: "AI service unavailable"
      }],
      itinerary: [{
        day: "Day 1",
        plan: [{
          time: "Error",
          placeName: "Generation Failed",
          placeDetails: "Please try again later",
          placeImageUrl: "",
          geoCoordinates: "0,0",
          ticketPricing: "N/A",
          timeToTravel: "N/A"
        }]
      }]
    };
  }
};

// ====== SIMPLE CHAT ======
export const sendMessage = async (message) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(message);
    return result.response.text();
  } catch {
    return "AI currently unavailable";
  }
};
