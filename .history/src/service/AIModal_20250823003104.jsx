import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Gemini AI with API key
const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// List of models to try in order for reliability
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

// Create the travel plan prompt
const createPrompt = (location, days, traveler, budget) => `
Create travel plan for ${location}.
- EXACTLY ${days} days
- Traveler: ${traveler}, Budget: ${budget}
- At least 4 hotels
- Each day: 4-5 activities with times
- Format JSON with "hotels" as array and "itinerary" as array
`;

// Main function to generate travel plan
export const generateTravelPlan = async (location, days, traveler, budget) => {
  const prompt = createPrompt(location, days, traveler, budget);

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);

      // Get text from AI response
      const text = await result.response.text();

      // Extract JSON from text using regex
      const match = text.match(/{[\s\S]*}/);
      if (!match) throw new Error("No valid JSON found in AI response");

      const parsed = JSON.parse(match[0]);

      // Ensure hotels and itinerary are arrays
      const hotels = Array.isArray(parsed.hotels) ? parsed.hotels : [];
      const itinerary = Array.isArray(parsed.itinerary)
        ? parsed.itinerary
        : Object.values(parsed.itinerary || []);

      return { hotels, itinerary };

    } catch (error) {
      console.warn(`${modelName} failed, trying next model...`, error);
    }
  }

  // Fallback if all models fail
  console.error("All models failed - returning empty travel plan");
  return {
    hotels: [],
    itinerary: []
  };
};
