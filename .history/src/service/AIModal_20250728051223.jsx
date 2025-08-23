import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const createTravelPrompt = (location, days, traveler, budget) => {
  return `Generate a JSON travel plan for a trip to ${location} for exactly ${days} days, for ${traveler}, with a ${budget} budget.

STRICT REQUIREMENTS:
- RETURN STRICTLY ${days} days in the itinerary array. Not more, not less.
- Each day must be labeled "Day 1" through "Day ${days}"
- Each day must include exactly 4 or 5 diverse and specific activities/places, with detailed time, location, and travel time.
- Ensure NO DAY is missing. Ensure NO EXTRA DAY is added.
- Ensure data is in English and formatted in **valid JSON** matching the exact schema below.

Include:
1. Hotels (4+ options): Each must have name, address, price, rating, geo coordinates, image URL, and short description.
2. Itinerary: Each day with 4-5 time-stamped locations, place name, details, ticket price, image URL, geo coordinates, and time to travel.

EXACT RESPONSE STRUCTURE:
{
  "hotels": [
    {
      "hotelName": "string",
      "hotelAddress": "string",
      "price": "string",
      "hotelImageUrl": "string",
      "geoCoordinates": "lat,lng",
      "rating": "string",
      "description": "string"
    }
    // 3 or more hotel objects
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "plan": [
        {
          "time": "string",
          "placeName": "string",
          "placeDetails": "string",
          "placeImageUrl": "string",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "string",
          "timeToTravel": "string"
        }
        // 4-5 activities
      ]
    }
    // up to "Day ${days}"
  ]
}

DO NOT include any explanation or text outside the JSON. Do NOT add commentary.`;
};

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const promptText = createTravelPrompt(location, days, traveler, budget);

    console.log("Prompt:", promptText);

    const result = await chatSession.sendMessage(promptText);
    const response = await result.response;
    const text = await response.text();

    console.log("Raw Response:", text);

    try {
      const parsed = JSON.parse(text);

      const generatedDays = parsed?.itinerary?.length || 0;
      if (generatedDays !== parseInt(days)) {
        throw new Error(`❌ Invalid itinerary days count: expected ${days}, got ${generatedDays}`);
      }

      return parsed;
    } catch (error) {
      console.error("Parsing Error:", error);
      return null;
    }

  } catch (error) {
    console.error("Error generating plan:", error);
    return null;
  }
};

export const chatSession = {
  sendMessage: async (promptText) => {
    const tempSession = model.startChat({ generationConfig, history: [] });
    const result = await tempSession.sendMessage(promptText);
    const response = await result.response;
    return await response.text();
  }
};

export const sendMessage = async (promptText) => {
  try {
    const result = await chatSession.sendMessage(promptText);
    console.log("Prompt:", promptText);
    console.log("Raw Response:", result);
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};
