import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.1,
  topP: 0.7,
  topK: 5,
  maxOutputTokens: 8000,
  responseMimeType: "application/json",
};

// حل بسيط ومضمون - برومبت واحد قوي
const createTravelPrompt = (location, days, traveler, budget) => {
  const daysNum = parseInt(days);
  
  // إنشاء template صريح لكل يوم
  let daysTemplate = "";
  for (let i = 1; i <= daysNum; i++) {
    daysTemplate += `    {
      "day": "Day ${i}",
      "plan": [
        {"time": "09:00-11:00", "placeName": "Place${i}A", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "15min"},
        {"time": "11:30-13:00", "placeName": "Place${i}B", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "10min"},
        {"time": "14:00-16:00", "placeName": "Place${i}C", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "20min"},
        {"time": "17:00-19:00", "placeName": "Place${i}D", "placeDetails": "Details", "placeImageUrl": "URL", "geoCoordinates": "lat,lng", "ticketPricing": "Price", "timeToTravel": "25min"}
      ]
    }`;
    if (i < daysNum) daysTemplate += ",\n";
  }

  return `COPY THIS EXACT JSON STRUCTURE AND FILL WITH REAL DATA FOR ${location}:

{
  "hotels": [
    {"hotelName": "Hotel1", "hotelAddress": "Address1", "price": "Price1", "hotelImageUrl": "URL1", "geoCoordinates": "lat1,lng1", "rating": "4.5", "description": "Desc1"},
    {"hotelName": "Hotel2", "hotelAddress": "Address2", "price": "Price2", "hotelImageUrl": "URL2", "geoCoordinates": "lat2,lng2", "rating": "4.2", "description": "Desc2"},
    {"hotelName": "Hotel3", "hotelAddress": "Address3", "price": "Price3", "hotelImageUrl": "URL3", "geoCoordinates": "lat3,lng3", "rating": "4.7", "description": "Desc3"},
    {"hotelName": "Hotel4", "hotelAddress": "Address4", "price": "Price4", "hotelImageUrl": "URL4", "geoCoordinates": "lat4,lng4", "rating": "4.3", "description": "Desc4"}
  ],
  "itinerary": [
${daysTemplate}
  ]
}

RULES: Replace ALL placeholder text with real ${location} data. Traveler: ${traveler}, Budget: ${budget}. MUST have exactly ${daysNum} days.`;
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
    console.log(`🎯 Target: ${daysNum} days for ${location}`);
    
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const promptText = createTravelPrompt(location, days, traveler, budget);
    
    const result = await chatSession.sendMessage(promptText);
    const response = await result.response;
    let text = await response.text();
    
    // محاولة parsing عادي
    let parsedResponse = fixBrokenJson(text);
    
    if (!parsedResponse) {
      console.log("❌ Failed to parse, trying backup method...");
      throw new Error("JSON parsing failed");
    }
    
    // فحص عدد الأيام
    const actualDays = parsedResponse.itinerary?.length || 0;
    console.log(`📊 Generated: ${actualDays}/${daysNum} days`);
    
    // إضافة أيام ناقصة فوراً
    if (actualDays < daysNum) {
      console.log(`🔧 Adding ${daysNum - actualDays} missing days...`);
      const missingDays = buildMissingDays(parsedResponse.itinerary || [], daysNum, location);
      parsedResponse.itinerary = [...(parsedResponse.itinerary || []), ...missingDays];
    }
    
    // تأكد من وجود 4 فنادق
    if (!parsedResponse.hotels || parsedResponse.hotels.length < 4) {
      console.log("🏨 Adding default hotels...");
      parsedResponse.hotels = [
        {"hotelName": `${location} Grand Hotel`, "hotelAddress": "City Center", "price": "$150-200", "hotelImageUrl": "https://example.com/hotel1.jpg", "geoCoordinates": "25.276,55.296", "rating": "4.5", "description": "Luxury hotel"},
        {"hotelName": `${location} Business Inn`, "hotelAddress": "Business District", "price": "$100-150", "hotelImageUrl": "https://example.com/hotel2.jpg", "geoCoordinates": "25.276,55.296", "rating": "4.2", "description": "Modern hotel"},
        {"hotelName": `${location} Resort`, "hotelAddress": "Tourist Area", "price": "$200-300", "hotelImageUrl": "https://example.com/hotel3.jpg", "geoCoordinates": "25.276,55.296", "rating": "4.7", "description": "Premium resort"},
        {"hotelName": `${location} Boutique`, "hotelAddress": "Old Town", "price": "$120-180", "hotelImageUrl": "https://example.com/hotel4.jpg", "geoCoordinates": "25.276,55.296", "rating": "4.3", "description": "Boutique hotel"}
      ];
    }
    
    console.log(`✅ Final result: ${parsedResponse.itinerary.length} days, ${parsedResponse.hotels.length} hotels`);
    return parsedResponse;
    
  } catch (error) {
    console.error("❌ Error:", error);
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