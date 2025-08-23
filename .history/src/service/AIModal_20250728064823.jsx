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
- MUST generate exactly ${days} days.
- Do NOT merge or skip any days.
- Each day must include 4 to 5 different activities.
- No duplication of activities between days.
- NO duration per place. DO NOT write how long the person will stay there.
- For each activity, only include the time of day (e.g. 9:00 AM) and estimated time to travel to the next activity (in minutes).
- Label each day clearly as "Day 1", "Day 2", ..., "Day ${days}".
- ONLY 3 to 4 hotels total for the entire trip. No more than 4.

INCLUDE:
1. Hotels (3 to 4 only): Each must have name, address, price, rating, geo coordinates, image URL, and short description.

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
          "time": "9:00 AM",
          "placeName": "Place Name",
          "placeDetails": "Short description",
          "placeImageUrl": "Image URL",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "$15 entry",
          "timeToTravel": "15 mins"
        }
      ]
    }
    // Repeat for all days up to Day ${days}
  ]
}
ONLY return valid JSON. No extra explanation.`;
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
    let generated = parsed.itinerary?.length || 0;

    if (generated < days) {
      const missing = days - generated;
      const continuePrompt = `
Continue the travel itinerary for ${location}.
Generate days from Day ${generated + 1} to Day ${days}.
Same format, 4 to 5 activities per day. No repeated places. No durations.
Valid JSON only:
[
  {
    "day": "Day ${generated + 1}",
    "plan": [...]
  }
]`;

      const extraResult = await chat.sendMessage(continuePrompt);
      const extraRaw = await extraResult.response.text();
      const extraClean = cleanJsonResponse(extraRaw);

      try {
        const extraDays = JSON.parse(extraClean);
        if (Array.isArray(extraDays)) {
          parsed.itinerary = [...(parsed.itinerary || []), ...extraDays];
        }
      } catch (e) {
        console.error("❌ Failed to parse extra days:", e);
      }
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