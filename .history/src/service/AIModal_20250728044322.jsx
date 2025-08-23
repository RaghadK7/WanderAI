import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.1,
  topP: 0.8,
  topK: 10,
  maxOutputTokens: 6000,
  responseMimeType: "application/json",
};

// حل نهائي مضمون - توليد الأيام بشكل منفصل للرحلات الطويلة
const generateDayChunk = async (location, startDay, endDay, traveler, budget, chatSession) => {
  const daysCount = endDay - startDay + 1;
  
  const dayPrompt = `Generate ${daysCount} days for ${location} travel plan.
Days: ${startDay} to ${endDay}
Traveler: ${traveler}, Budget: ${budget}

Return ONLY this JSON:
{
  "days": [
${Array.from({length: daysCount}, (_, i) => {
  const dayNum = startDay + i;
  return `    {
      "day": "Day ${dayNum}",
      "plan": [
        {"time": "09:00-11:00", "placeName": "Real Morning Place ${dayNum}", "placeDetails": "Complete description", "placeImageUrl": "https://example.com/place.jpg", "geoCoordinates": "25.276,55.296", "ticketPricing": "$20", "timeToTravel": "15min"},
        {"time": "11:30-13:00", "placeName": "Real Late Morning Place ${dayNum}", "placeDetails": "Complete description", "placeImageUrl": "https://example.com/place.jpg", "geoCoordinates": "25.276,55.296", "ticketPricing": "Free", "timeToTravel": "10min"},
        {"time": "14:00-16:00", "placeName": "Real Afternoon Place ${dayNum}", "placeDetails": "Complete description", "placeImageUrl": "https://example.com/place.jpg", "geoCoordinates": "25.276,55.296", "ticketPricing": "$15", "timeToTravel": "20min"},
        {"time": "17:00-19:00", "placeName": "Real Evening Place ${dayNum}", "placeDetails": "Complete description", "placeImageUrl": "https://example.com/place.jpg", "geoCoordinates": "25.276,55.296", "ticketPricing": "$25", "timeToTravel": "25min"}
      ]
    }`;
}).join(',\n')}
  ]
}

Use REAL places in ${location}. Fill ALL data.`;

  const result = await chatSession.sendMessage(dayPrompt);
  const response = await result.response;
  const text = await response.text();
  
  try {
    const parsed = JSON.parse(text.trim());
    return parsed.days || [];
  } catch (error) {
    console.error(`Error parsing days ${startDay}-${endDay}:`, error);
    return [];
  }
};

const generateHotels = async (location, budget, chatSession) => {
  const hotelPrompt = `Generate 4 hotels for ${location} with ${budget} budget.

Return ONLY this JSON:
{
  "hotels": [
    {"hotelName": "Real Hotel Name 1", "hotelAddress": "Complete real address", "price": "$150-200/night", "hotelImageUrl": "https://example.com/hotel1.jpg", "geoCoordinates": "25.276,55.296", "rating": "4.5", "description": "Luxury hotel with spa and pool"},
    {"hotelName": "Real Hotel Name 2", "hotelAddress": "Complete real address", "price": "$100-150/night", "hotelImageUrl": "https://example.com/hotel2.jpg", "geoCoordinates": "25.276,55.296", "rating": "4.2", "description": "Modern business hotel"},
    {"hotelName": "Real Hotel Name 3", "hotelAddress": "Complete real address", "price": "$200-300/night", "hotelImageUrl": "https://example.com/hotel3.jpg", "geoCoordinates": "25.276,55.296", "rating": "4.7", "description": "Premium resort with beach access"},
    {"hotelName": "Real Hotel Name 4", "hotelAddress": "Complete real address", "price": "$120-180/night", "hotelImageUrl": "https://example.com/hotel4.jpg", "geoCoordinates": "25.276,55.296", "rating": "4.3", "description": "Boutique hotel in city center"}
  ]
}

Use REAL hotel names in ${location}.`;

  const result = await chatSession.sendMessage(hotelPrompt);
  const response = await result.response;
  const text = await response.text();
  
  try {
    const parsed = JSON.parse(text.trim());
    return parsed.hotels || [];
  } catch (error) {
    console.error("Error parsing hotels:", error);
    return [];
  }
};

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const daysNum = parseInt(days);
    console.log(`🚀 Generating ${daysNum} days for ${location}`);
    
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    // توليد الفنادق أولاً
    console.log("📍 Generating hotels...");
    const hotels = await generateHotels(location, budget, chatSession);
    
    // توليد الأيام بشكل منفصل
    const allDays = [];
    const chunkSize = daysNum > 7 ? 3 : daysNum; // للرحلات الطويلة نقسمها لقطع صغيرة
    
    for (let i = 1; i <= daysNum; i += chunkSize) {
      const endDay = Math.min(i + chunkSize - 1, daysNum);
      console.log(`📅 Generating days ${i}-${endDay}...`);
      
      const dayChunk = await generateDayChunk(location, i, endDay, traveler, budget, chatSession);
      allDays.push(...dayChunk);
      
      // استراحة قصيرة بين الطلبات
      if (endDay < daysNum) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const result = {
      hotels: hotels,
      itinerary: allDays
    };
    
    console.log(`✅ Generated ${allDays.length}/${daysNum} days and ${hotels.length} hotels`);
    
    // فحص نهائي
    if (allDays.length !== daysNum) {
      console.warn(`⚠️ Expected ${daysNum} days, got ${allDays.length}`);
    }
    
    return result;
    
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