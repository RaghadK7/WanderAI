import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// البرومبت المضمون 100%
const createTravelPrompt = (location, days, traveler, budget) => {
  // إنشاء قائمة الأيام المطلوبة بشكل صريح
  const daysList = Array.from({length: parseInt(days)}, (_, i) => `"Day ${i + 1}"`).join(', ');
  
  return `Generate travel plan for ${location} for ${traveler} with ${budget} budget.

CRITICAL: You must generate EXACTLY these ${days} days: ${daysList}

Your itinerary array MUST contain exactly ${days} objects, one for each day.

Required JSON structure:
{
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Address",
      "price": "Price",
      "hotelImageUrl": "URL",
      "geoCoordinates": "lat,lng",
      "rating": "4.5/5",
      "description": "Description"
    }
  ],
  "itinerary": [
    ${Array.from({length: parseInt(days)}, (_, i) => `{
      "day": "Day ${i + 1}",
      "plan": [
        {
          "time": "09:00-11:00",
          "placeName": "Place Name",
          "placeDetails": "Details",
          "placeImageUrl": "URL",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "Price",
          "timeToTravel": "Duration"
        }
      ]
    }`).join(',\n    ')}
  ]
}

IMPORTANT RULES:
- Use ONLY real, existing places in ${location}
- Include famous landmarks, popular restaurants, actual museums, real markets
- Provide accurate addresses and realistic prices
- No fictional or made-up places
- Research well-known attractions for ${location}

Fill each day with 4-5 real activities covering: famous attractions, popular restaurants, actual shopping areas, real cultural sites.