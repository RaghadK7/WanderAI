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
- Format JSON with "hotels" and "itinerary"
`;

// Main function to generate travel plan
export const generateTravelPlan = async (location, days, traveler, budget) => {
  const prompt = createPrompt(location, days, traveler, budget);

  // Try models in order until one succeeds
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);

      // Get text from AI response
      const text = await result.response.text();

      // Clean response from code blocks / markdown
      const cleaned = text.replace(/json/gi, '').replace(//g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("No valid JSON found");

      // Parse and return JSON
      return JSON.parse(cleaned.substring(start, end + 1));

    } catch (error) {
      console.warn(${modelName} failed, trying next model...);
    }
  }

  // If all models fail, return a safe fallback
  console.error("All models failed - returning empty travel plan");
  return {
    hotels: [],
    itinerary: []
  };
};