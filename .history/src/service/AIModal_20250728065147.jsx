import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const createTravelPrompt = (location, days, traveler, budget) => {
  return `
Generate a detailed travel plan for a trip to ${location} for exactly ${days} days, customized for ${traveler}, with a ${budget} budget.

RULES:
- STRICTLY generate exactly ${days} separate and non-repeating days.
- Do NOT merge or skip any day.
- If ${days} days cannot be generated, return NOTHING.
- Label each day clearly as "Day 1", ..., "Day ${days}".
- Each day must include 3 to 5 unique places/activities.
- DO NOT add time for each place/activity.
- INSTEAD: Add estimated travel time **between** activities in sequence (e.g. "Time to next: 15 mins").
- Use real places. No imaginary content.

Include:
1. Hotels (4+ options): name, address, price, rating, geo coordinates, image URL, and short description.

RESPONSE FORMAT (JSON only):
{
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Full Address",
      "price": "$100-150/night",
      "hotelImageUrl": "Image URL",
      "geoCoordinates": "lat,lng",
      "rating": "4.5",
      "description": "Short description"
    }
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "plan": [
        {
          "placeName": "Place Name",
          "placeDetails": "Short description",
          "placeImageUrl": "Image URL",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "$15 entry",
          "timeToNext": "15 mins"
        },
        ...
      ]
    }
    // Repeat until Day ${days}
  ]
}
ONLY return VALID JSON. No extra explanation or markdown.`;
};

const cleanJsonResponse = (text) => {
  return text.trim().replace(/^json/, "").replace(/```/g, "").trim();
};

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const chat = model.startChat({ generationConfig, history: [] });

    const promptText = createTravelPrompt(location, days, traveler, budget);
    const result = await chat.sendMessage(promptText);
    const response = await result.response;
    const rawText = await response.text();
    const cleanedText = cleanJsonResponse(rawText);

    let parsed = JSON.parse(cleanedText);
    const generatedDays = parsed.itinerary?.length || 0;

    if (generatedDays !== days) {
      console.warn(`Expected ${days} days but got ${generatedDays}. Returning null.`);
      return null;
    }

    return parsed;
  } catch (err) {
    console.error("🔥 Error generating trip:", err);
    return null;
  }
};

export const chatSession = {
  sendMessage: async (promptText) => {
    const chat = model.startChat({ generationConfig, history: [] });
    const result = await chat.sendMessage(promptText);
    const response = await result.response;
    return await response.text();
  },
};

export const sendMessage = async (promptText) => {
  try {
    const result = await chatSession.sendMessage(promptText);
    return result;
  } catch (err) {
    console.error("❌ Send Message Error:", err);
    return null;
  }
};
