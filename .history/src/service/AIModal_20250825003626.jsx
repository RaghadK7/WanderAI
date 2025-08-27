import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

// createPrompt 
const createPrompt = (location, days, traveler, budget) => `
Create travel plan for ${location}. Generate EXACTLY ${days} days.

Requirements:
- Traveler: ${traveler}, Budget: ${budget}
- At least 4 Hotels
- Each day: 4-5 activities with times

JSON format:
{
  "hotels": [{"hotelName":"Name","hotelAddress":"Address","price":"$XX/night","hotelImageUrl":"url","geoCoordinates":"lat,lng","rating":"X.X","description":"text"}],
  "itinerary": [{"day":"Day 1","plan":[{"time":"9:00 AM","placeName":"Name","placeDetails":"Details","placeImageUrl":"url","geoCoordinates":"lat,lng","ticketPricing":"$XX","timeToTravel":"XX mins"}]}]
}

Generate all ${days} days now:
`;

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const prompt = createPrompt(location, days, traveler, budget);

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = await result.response.text();
        const match = text.match(/{[\s\S]*}/);

        if (match) {
          const parsed = JSON.parse(match[0]);

          parsed.itinerary = Array.isArray(parsed.itinerary)
            ? parsed.itinerary
            : Object.values(parsed.itinerary || []);

          //  Log which model successfully generated the travel plan
          console.log(`🎉 Travel plan generated using model: ${modelName}`);

          return parsed;
        }
      } catch (error) {
        console.warn(`❌ Model ${modelName} failed, trying next one...`);
      }
    }

    // Fallback if all models fail
    return {
      hotels: [{
        hotelName: "Generation Failed",
        hotelAddress: "Please try again",
        price: "N/A",
        hotelImageUrl: "",
        geoCoordinates: "0,0",
        rating: "0",
        description: "AI currently unavailable"
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

  } catch (error) {
    console.error("🔥 Generation error:", error);
    return { hotels: [], itinerary: [] };
  }
};
