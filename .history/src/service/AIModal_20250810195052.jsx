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
  return `Create a detailed travel plan for ${location} for exactly ${days} days.

Requirements:
- Traveler type: ${traveler}
- Budget: ${budget}
- Generate exactly ${days} hotels (different hotels each day)
- Generate exactly ${days} days with 4-5 activities each day
- Activities should be planned logically by location to minimize travel time
- Include accurate travel times between locations

IMPORTANT for timeToTravel field:
- Calculate realistic travel time from the PREVIOUS location to current location
- Format: "15 mins from [Previous Place]" or "25 mins from hotel" 
- For first activity of the day: "20 mins from hotel"
- Consider traffic and transportation method
- Be specific about the starting point

JSON format only (no extra text):
{
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Complete address with area/district",
      "price": "$XX/night",
      "hotelImageUrl": "realistic hotel image url",
      "geoCoordinates": "accurate latitude,longitude",
      "rating": "X.X",
      "description": "Brief hotel description with amenities"
    }
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "plan": [
        {
          "time": "9:00 AM",
          "placeName": "Attraction/Activity Name",
          "placeDetails": "Detailed description of what to do here",
          "placeImageUrl": "realistic place image url",
          "geoCoordinates": "accurate latitude,longitude",
          "ticketPricing": "$XX per person" or "Free",
          "timeToTravel": "XX mins from [specific previous location]"
        }
      ]
    }
  ]
}

Make sure travel times are realistic and logical based on actual distances in ${location}.`;
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