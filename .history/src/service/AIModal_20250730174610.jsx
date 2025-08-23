import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

const config = {
  temperature: 0.4,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const createPrompt = (location, days, traveler, budget) => {
  return `Create travel plan for ${location}. Generate EXACTLY ${days} days, no exceptions.

Requirements:
- Traveler: ${traveler}, Budget: ${budget}
- Generate ${days} hotels minimum
- Each day: 4-5 activities with times
- All ${days} days must be included

JSON format:
{
  "hotels": [
    {"hotelName": "Name", "hotelAddress": "Address", "price": "$XX/night", "hotelImageUrl": "url", "geoCoordinates": "lat,lng", "rating": "X.X", "description": "text"}
  ],
  "itinerary": [
    {"day": "Day 1", "plan": [{"time": "9:00 AM", "placeName": "Name", "placeDetails": "Details", "placeImageUrl": "url", "geoCoordinates": "lat,lng", "ticketPricing": "$XX", "timeToTravel": "XX mins"}]}
  ]
}

Generate all ${days} days now:`;
};

const tryAllModels = async (prompt, maxRetries = 2) => {
  for (const modelName of MODELS) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Trying ${modelName} - Attempt ${attempt}`);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        console.log(`✅ Success with ${modelName}`);
        return text;
        
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message}`);
        
        if (error.status === 503) {
          await new Promise(r => setTimeout(r, 3000)); // Wait 3s for overload
        }
        
        if (attempt === maxRetries) {
          console.log(`💥 ${modelName} completely failed`);
        }
      }
    }
  }
  throw new Error("All models failed - AI not responding");
};

const parseJSON = (text) => {
  let cleaned = text.trim()
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/^json/i, '')
    .trim();
  
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error("No valid JSON found");
  }
  
  return JSON.parse(cleaned.substring(start, end + 1));
};

const forceDays = async (location, currentDays, targetDays) => {
  const missing = targetDays - currentDays;
  console.log(`🔧 Force generating ${missing} missing days`);
  
  const forcePrompt = `Generate EXACTLY ${missing} more days for ${location}. Start from Day ${currentDays + 1} to Day ${targetDays}.

JSON array format:
[
  {"day": "Day ${currentDays + 1}", "plan": [{"time": "9:00 AM", "placeName": "Place", "placeDetails": "Details", "placeImageUrl": "url", "geoCoordinates": "lat,lng", "ticketPricing": "$XX", "timeToTravel": "XX mins"}]}
]

Generate ${missing} days:`;
  
  try {
    const response = await tryAllModels(forcePrompt);
    const extraClean = response.trim()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    
    return JSON.parse(extraClean);
  } catch (error) {
    console.error("❌ Force generation failed:", error);
    return [];
  }
};

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    console.log(`🚀 Generating ${days} days for ${location}`);
    
    // Step 1: Try to generate complete plan
    const prompt = createPrompt(location, days, traveler, budget);
    const response = await tryAllModels(prompt);
    const parsed = parseJSON(response);
    
    const generated = parsed.itinerary?.length || 0;
    console.log(`📊 Generated: ${generated}/${days} days`);
    
    // Step 2: Force missing days if needed
    if (generated < days) {
      console.log(`⚠️ Missing ${days - generated} days - forcing generation`);
      
      const extraDays = await forceDays(location, generated, days);
      
      if (Array.isArray(extraDays) && extraDays.length > 0) {
        parsed.itinerary = [...(parsed.itinerary || []), ...extraDays];
        console.log(`✅ Added ${extraDays.length} forced days`);
      }
    }
    
    // Step 3: Validate final result
    const finalDays = parsed.itinerary?.length || 0;
    const finalHotels = parsed.hotels?.length || 0;
    
    console.log(`🎯 Final: ${finalDays} days, ${finalHotels} hotels`);
    
    if (finalDays < days) {
      console.warn(`⚠️ Warning: Only ${finalDays}/${days} days generated`);
    }
    
    return parsed;
    
  } catch (error) {
    console.error("🔥 Generation completely failed:", error);
    
    // Last resort: Return basic structure
    return {
      hotels: [{
        hotelName: "Generation Failed",
        hotelAddress: "Please try again",
        price: "N/A",
        hotelImageUrl: "",
        geoCoordinates: "0,0",
        rating: "0",
        description: "AI models are currently unavailable"
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
  }
};

// Simplified chat functions
const getWorkingModel = async () => {
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      await model.generateContent("test");
      return model;
    } catch (error) {
      continue;
    }
  }
  throw new Error("No working model found");
};

export const chatSession = {
  sendMessage: async (prompt) => {
    try {
      const model = await getWorkingModel();
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("❌ Chat failed:", error);
      return "AI currently unavailable";
    }
  }
};

export const sendMessage = async (prompt) => {
  return await chatSession.sendMessage(prompt);
};