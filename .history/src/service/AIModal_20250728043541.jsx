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
  maxOutputTokens: 4000,
  responseMimeType: "application/json",
};

const createTravelPrompt = (location, days, traveler, budget) => {
  const daysNum = parseInt(days);
  
  return `Create ${daysNum} day travel plan for ${location}. 
Traveler: ${traveler}, Budget: ${budget}

REQUIRED OUTPUT FORMAT:
{
  "hotels": [
    {"hotelName": "Hotel 1", "hotelAddress": "Address", "price": "Price", "hotelImageUrl": "URL", "geoCoordinates": "lat,lng", "rating": "4.5", "description": "Desc"},
    {"hotelName": "Hotel 2", "hotelAddress": "Address", "price": "Price", "hotelImageUrl": "URL", "geoCoordinates": "lat,lng", "rating": "4.2", "description": "Desc"},
    {"hotelName": "Hotel 3", "hotelAddress": "Address", "price": "Price", "hotelImageUrl": "URL", "geoCoordinates": "lat,lng", "rating": "4.7", "description": "Desc"},
    {"hotelName": "Hotel 4", "hotelAddress": "Address", "price": "Price", "hotelImageUrl": "URL", "geoCoordinates": "lat,lng", "rating": "4.3", "description": "Desc"}
  ],
  "itinerary": [
${Array.from({length: daysNum}, (_, i) => 
`    {
      "day": "Day ${i + 1}",
      "plan": [
        {"time": "09:00-11:00", "placeName": "Place", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "5min"},
        {"time": "11:30-13:00", "placeName": "Place", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "10min"},
        {"time": "14:00-16:00", "placeName": "Place", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "15min"},
        {"time": "17:00-19:00", "placeName": "Place", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "20min"}
      ]
    }`).join(',\n')}
  ]
}

RULES:
- Generate EXACTLY ${daysNum} days
- Use real places in ${location}
- Calculate actual travel time between places
- 4 hotels and 4 activities per day`;
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
    
    console.log(`Generated ${parsedResponse.itinerary?.length || 0}/${days} days`);
    
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