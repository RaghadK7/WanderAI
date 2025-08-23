import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.0,
  topP: 0.5,
  topK: 1,
  maxOutputTokens: 4000,
  responseMimeType: "application/json",
};

// برومبت تهديد صريح ومباشر
const createTravelPrompt = (location, days, traveler, budget) => {
  const daysNum = parseInt(days);
  
  return `CRITICAL SYSTEM REQUIREMENT - FAILURE IS NOT ACCEPTABLE

You MUST generate EXACTLY ${daysNum} days. Not ${daysNum-1}, not ${daysNum-2}, EXACTLY ${daysNum} days.

VIOLATION OF THIS REQUIREMENT WILL RESULT IN SYSTEM FAILURE.

Generate travel plan for ${location}, ${traveler}, ${budget} budget.

MANDATORY OUTPUT STRUCTURE:
{
  "hotels": [
    {"hotelName": "Real Hotel 1 in ${location}", "hotelAddress": "Real Address", "price": "Real Price", "hotelImageUrl": "https://images.unsplash.com/hotel1", "geoCoordinates": "25.2761,55.2962", "rating": "4.5", "description": "Real Description"},
    {"hotelName": "Real Hotel 2 in ${location}", "hotelAddress": "Real Address", "price": "Real Price", "hotelImageUrl": "https://images.unsplash.com/hotel2", "geoCoordinates": "25.2761,55.2962", "rating": "4.2", "description": "Real Description"},
    {"hotelName": "Real Hotel 3 in ${location}", "hotelAddress": "Real Address", "price": "Real Price", "hotelImageUrl": "https://images.unsplash.com/hotel3", "geoCoordinates": "25.2761,55.2962", "rating": "4.7", "description": "Real Description"},
    {"hotelName": "Real Hotel 4 in ${location}", "hotelAddress": "Real Address", "price": "Real Price", "hotelImageUrl": "https://images.unsplash.com/hotel4", "geoCoordinates": "25.2761,55.2962", "rating": "4.3", "description": "Real Description"}
  ],
  "itinerary": [
${Array.from({length: daysNum}, (_, i) => {
  const dayNum = i + 1;
  return `    {"day": "Day ${dayNum}", "plan": [
      {"time": "09:00-11:00", "placeName": "Real ${location} Morning Place Day${dayNum}", "placeDetails": "Real detailed description", "placeImageUrl": "https://images.unsplash.com/place${dayNum}a", "geoCoordinates": "25.2761,55.2962", "ticketPricing": "Real price", "timeToTravel": "15min"},
      {"time": "11:30-13:00", "placeName": "Real ${location} Late Morning Place Day${dayNum}", "placeDetails": "Real detailed description", "placeImageUrl": "https://images.unsplash.com/place${dayNum}b", "geoCoordinates": "25.2761,55.2962", "ticketPricing": "Real price", "timeToTravel": "10min"},
      {"time": "14:00-16:00", "placeName": "Real ${location} Afternoon Place Day${dayNum}", "placeDetails": "Real detailed description", "placeImageUrl": "https://images.unsplash.com/place${dayNum}c", "geoCoordinates": "25.2761,55.2962", "ticketPricing": "Real price", "timeToTravel": "20min"},
      {"time": "17:00-19:00", "placeName": "Real ${location} Evening Place Day${dayNum}", "placeDetails": "Real detailed description", "placeImageUrl": "https://images.unsplash.com/place${dayNum}d", "geoCoordinates": "25.2761,55.2962", "ticketPricing": "Real price", "timeToTravel": "25min"}
    ]}`;
}).join(',\n')}
  ]
}

VERIFICATION: Count the days in itinerary array = ${daysNum}. If not ${daysNum}, YOU HAVE FAILED.

REPETITION IS ALLOWED AND EXPECTED. Use same places multiple times if needed to reach exactly ${daysNum} days.

NO EXCUSES. NO SHORTCUTS. EXACTLY ${daysNum} DAYS OR SYSTEM ERROR.`;
};
};

// معالج قوي للـ JSON المكسور
const fixBrokenJson = (text) => {
  try {
    // تنظيف النص
    let cleaned = text.trim();
    
    // العثور على بداية ونهاية JSON
    const start = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (start === -1 || lastBrace === -1) return null;
    
    cleaned = cleaned.substring(start, lastBrace + 1);
    
    // محاولة إصلاح الفواصل المفقودة
    cleaned = cleaned.replace(/}\s*{/g, '},{');
    cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"');
    
    return JSON.parse(cleaned);
  } catch (error) {
    return null;
  }
};

// دالة بناء أيام إضافية إذا نقصت
const buildMissingDays = (existingDays, targetCount, location) => {
  const missing = [];
  for (let i = existingDays.length + 1; i <= targetCount; i++) {
    missing.push({
      "day": `Day ${i}`,
      "plan": [
        {"time": "09:00-11:00", "placeName": `${location} Morning Spot ${i}`, "placeDetails": "Popular morning attraction", "placeImageUrl": "https://example.com/place.jpg", "geoCoordinates": "25.276,55.296", "ticketPricing": "Free", "timeToTravel": "15min"},
        {"time": "11:30-13:00", "placeName": `${location} Cultural Site ${i}`, "placeDetails": "Cultural landmark visit", "placeImageUrl": "https://example.com/place.jpg", "geoCoordinates": "25.276,55.296", "ticketPricing": "$20", "timeToTravel": "10min"},
        {"time": "14:00-16:00", "placeName": `${location} Shopping ${i}`, "placeDetails": "Local market or mall", "placeImageUrl": "https://example.com/place.jpg", "geoCoordinates": "25.276,55.296", "ticketPricing": "Free", "timeToTravel": "20min"},
        {"time": "17:00-19:00", "placeName": `${location} Dining ${i}`, "placeDetails": "Local restaurant experience", "placeImageUrl": "https://example.com/place.jpg", "geoCoordinates": "25.276,55.296", "ticketPricing": "$50", "timeToTravel": "25min"}
      ]
    });
  }
  return missing;
};

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const daysNum = parseInt(days);
    console.log(`🔥 DEMANDING EXACTLY ${daysNum} days for ${location}`);
    
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const promptText = createTravelPrompt(location, days, traveler, budget);
    
    const result = await chatSession.sendMessage(promptText);
    const response = await result.response;
    let text = await response.text();
    
    let parsedResponse = fixBrokenJson(text);
    
    if (!parsedResponse) {
      console.log("❌ JSON failed, forcing backup...");
      parsedResponse = {
        hotels: [],
        itinerary: []
      };
    }
    
    // فحص الأيام وإجبار العدد الصحيح
    const actualDays = parsedResponse.itinerary?.length || 0;
    console.log(`⚡ AI gave ${actualDays}/${daysNum} days`);
    
    // إجبار العدد الصحيح - بدون تفاوض
    if (actualDays !== daysNum) {
      console.log(`🚨 FORCING ${daysNum} days - NO MERCY`);
      
      // مسح كل شيء وبناء العدد الصحيح
      const forcedDays = [];
      for (let i = 1; i <= daysNum; i++) {
        forcedDays.push({
          "day": `Day ${i}`,
          "plan": [
            {"time": "09:00-11:00", "placeName": `${location} Attraction ${i}A`, "placeDetails": `Popular morning destination in ${location}`, "placeImageUrl": "https://images.unsplash.com/photo-1469474968028-56623f02e42e", "geoCoordinates": "25.2048,55.2708", "ticketPricing": "Free", "timeToTravel": "15min"},
            {"time": "11:30-13:00", "placeName": `${location} Site ${i}B`, "placeDetails": `Cultural landmark in ${location}`, "placeImageUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4", "geoCoordinates": "25.2048,55.2708", "ticketPricing": "$20", "timeToTravel": "10min"},
            {"time": "14:00-16:00", "placeName": `${location} Market ${i}C`, "placeDetails": `Shopping area in ${location}`, "placeImageUrl": "https://images.unsplash.com/photo-1441986300917-64674bd600d8", "geoCoordinates": "25.2048,55.2708", "ticketPricing": "Free", "timeToTravel": "20min"},
            {"time": "17:00-19:00", "placeName": `${location} Restaurant ${i}D`, "placeDetails": `Dining experience in ${location}`, "placeImageUrl": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", "geoCoordinates": "25.2048,55.2708", "ticketPricing": "$50", "timeToTravel": "25min"}
          ]
        });
      }
      parsedResponse.itinerary = forcedDays;
    }
    
    // إجبار 4 فنادق
    if (!parsedResponse.hotels || parsedResponse.hotels.length < 4) {
      parsedResponse.hotels = [
        {"hotelName": `${location} Grand Hotel`, "hotelAddress": `Downtown ${location}`, "price": "$200-300", "hotelImageUrl": "https://images.unsplash.com/photo-1564501049412-61c2a3083791", "geoCoordinates": "25.2048,55.2708", "rating": "4.5", "description": "Luxury hotel with premium amenities"},
        {"hotelName": `${location} Business Inn`, "hotelAddress": `Business District ${location}`, "price": "$150-200", "hotelImageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa", "geoCoordinates": "25.2048,55.2708", "rating": "4.2", "description": "Modern business hotel"},
        {"hotelName": `${location} Resort`, "hotelAddress": `Tourist Area ${location}`, "price": "$250-350", "hotelImageUrl": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4", "geoCoordinates": "25.2048,55.2708", "rating": "4.7", "description": "Beach resort with spa"},
        {"hotelName": `${location} Boutique`, "hotelAddress": `Old Town ${location}`, "price": "$180-250", "hotelImageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945", "geoCoordinates": "25.2048,55.2708", "rating": "4.3", "description": "Boutique hotel with character"}
      ];
    }
    
    console.log(`✅ FINAL RESULT: ${parsedResponse.itinerary.length} days (FORCED TO ${daysNum})`);
    return parsedResponse;
    
  } catch (error) {
    console.error("❌ SYSTEM ERROR:", error);
    return { error: error.message };
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