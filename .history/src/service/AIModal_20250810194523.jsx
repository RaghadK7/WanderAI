import { GoogleGenerativeAI } from "@google/generative-ai";

// Setup
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY);
const MODELS = ["gemini-2.5-flash", "gemini-1.5-flash"];

// Try models until one works  
const getWorkingModel = async (prompt) => {
  for (const modelName of MODELS) {
    try {
      console.log(`Trying ${modelName}...`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { temperature: 0.4, maxOutputTokens: 8192, responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      console.log(`✅ ${modelName} worked!`);
      return result.response.text();
    } catch (error) {
      console.log(`❌ ${modelName} failed:`, error.message);
      // Wait a bit before trying next model
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error("All models failed");
};

// Create travel prompt
const createPrompt = (location, days, traveler, budget) => {
  return `Create a travel plan for ${location} for exactly ${days} days.

Details:
- Traveler: ${traveler}
- Budget: ${budget}
- Generate exactly ${days} hotels
- Generate exactly ${days} days with 4-5 activities each

JSON format only:
{
  "hotels": [
    {"hotelName": "Name", "hotelAddress": "Address", "price": "$XX/night", "hotelImageUrl": "url", "geoCoordinates": "lat,lng", "rating": "X.X", "description": "text"}
  ],
  "itinerary": [
    {"day": "Day 1", "plan": [{"time": "9:00 AM", "placeName": "Name", "placeDetails": "Details", "placeImageUrl": "url", "geoCoordinates": "lat,lng", "ticketPricing": "$XX", "timeToTravel": "XX mins"}]}
  ]
}`;
};

// Clean and parse JSON
const parseJSON = (text) => {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(cleaned.substring(start, end + 1));
};

// Main function
export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    console.log(`🚀 Generating ${days} days for ${location}`);
    
    const prompt = createPrompt(location, days, traveler, budget);
    const response = await getWorkingModel(prompt);
    const result = parseJSON(response);
    
    console.log(`✅ Generated: ${result.itinerary?.length || 0} days, ${result.hotels?.length || 0} hotels`);
    return result;
    
  } catch (error) {
    console.error('❌ Failed:', error);
    return {
      hotels: [{ hotelName: "Error", hotelAddress: "Try again", price: "N/A", hotelImageUrl: "", geoCoordinates: "0,0", rating: "0", description: "AI unavailable" }],
      itinerary: [{ day: "Day 1", plan: [{ time: "Error", placeName: "Failed", placeDetails: "Try again later", placeImageUrl: "", geoCoordinates: "0,0", ticketPricing: "N/A", timeToTravel: "N/A" }] }]
    };
  }
};

// Simple chat
export const sendMessage = async (message) => {
  try {
    const response = await getWorkingModel(message);
    return response;
  } catch (error) {
    return "AI currently unavailable";
  }
};