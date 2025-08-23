import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.5,
  topP: 0.8,
  topK: 20,
  maxOutputTokens: 3000,
  responseMimeType: "application/json",
};

// برومبت مضمون 100% للعدد الصحيح من الأيام
const createTravelPrompt = (location, days, traveler, budget) => {
  // إنشاء template الأيام بشكل صريح
  const itineraryTemplate = [];
  for (let i = 1; i <= parseInt(days); i++) {
    itineraryTemplate.push(`{
      "day": "Day ${i}",
      "plan": [
        {"time": "09:00-11:30", "placeName": "Morning Place", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "30min"},
        {"time": "12:00-14:00", "placeName": "Lunch Place", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "20min"},
        {"time": "15:00-17:30", "placeName": "Afternoon Place", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "25min"}
      ]
    }`);
  }

  return `Travel plan for ${location} - ${days} days for ${traveler} with ${budget} budget.

YOU MUST FILL THIS EXACT TEMPLATE WITH ${days} DAYS:

{
  "hotels": [
    {"hotelName": "Hotel Option 1", "hotelAddress": "Address 1", "price": "Price range", "hotelImageUrl": "URL", "geoCoordinates": "lat,lng", "rating": "4.5", "description": "Description"},
    {"hotelName": "Hotel Option 2", "hotelAddress": "Address 2", "price": "Price range", "hotelImageUrl": "URL", "geoCoordinates": "lat,lng", "rating": "4.2", "description": "Description"},
    {"hotelName": "Hotel Option 3", "hotelAddress": "Address 3", "price": "Price range", "hotelImageUrl": "URL", "geoCoordinates": "lat,lng", "rating": "4.7", "description": "Description"},
    {"hotelName": "Hotel Option 4", "hotelAddress": "Address 4", "price": "Price range", "hotelImageUrl": "URL", "geoCoordinates": "lat,lng", "rating": "4.3", "description": "Description"}
  ],
  "itinerary": [
    ${itineraryTemplate.join(',\n    ')}
  ]
}

RULES:
- Use real places in ${location}
- Logical time slots (09:00-11:30, 12:00-14:00, 15:00-17:30)
- MUST include exactly ${days} days
- 4 different hotel options
- Fill every day template above`;
};

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const promptText = createTravelPrompt(location, days, traveler, budget);
    
    const result = await chatSession.sendMessage(promptText);
    const response = await result.response;
    const text = await response.text();
    
    const parsedResponse = JSON.parse(text);
    
    // فحص سريع
    const generatedDays = parsedResponse.itinerary?.length || 0;
    const hotelsCount = parsedResponse.hotels?.length || 0;
    
    console.log(`Days: ${generatedDays}/${days}, Hotels: ${hotelsCount}`);
    
    return parsedResponse;
    
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

export const chatSession = {
  sendMessage: async (promptText) => {
    const tempSession = model.startChat({
      generationConfig,
      history: [],
    });
    
    const result = await tempSession.sendMessage(promptText);
    const response = await result.response;
    return await response.text();
  }
};

export const sendMessage = async (promptText) => {
  try {
    const result = await chatSession.sendMessage(promptText);
    return result;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};