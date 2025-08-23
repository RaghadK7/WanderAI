import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// إنشاء دالة لتوليد prompt محدد لعدد الأيام المطلوبة
const createTravelPrompt = (location, days, traveler, budget) => {
  return `Generate Travel Plan for Location: ${location}, for ${days} Days for ${traveler} with a ${budget} budget.

IMPORTANT REQUIREMENTS:
- Generate EXACTLY ${days} days in the itinerary array
- Each day should be labeled as "Day 1", "Day 2", "Day 3", "Day 4","Day 5","Day 6","Day 7","Day 8","Day 9","Day 10","Day 11","Day 12","Day 13","Day 14","Day 15". up to "Day ${days}"
- Each day should have 4-6 activities/places with specifica and real times
- Do not generate less than ${days} days
- Ensure NO DAY is missing. Ensure NO EXTRA DAY is added.
- Ensure data is in English and formatted in **valid JSON** matching the exact schema below.
- Include all required fields for hotels and itinerary as specified below.
Include:
1. Hotels (4+ options): Each must have name, address, price, rating, geo coordinates, image URL, and short description.
2. Itinerary: Each day with 4-5 time-stamped locations, place name, details, ticket price, image URL, geo coordinates, and time to travel.

Format the response in JSON with this exact structure:
{
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Full Address",
      "price": "Price Range",
      "hotelImageUrl": "Image URL",
      "geoCoordinates": "lat,lng",
      "rating": "Rating",
      "description": "Description"
    }
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "plan": [
        {
          "time": "Time",
          "placeName": "Place Name",
          "placeDetails": "Details",
          "placeImageUrl": "Image URL",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "Price",
          "timeToTravel": "Duration"
        }
      ]
    }
    // Continue for ALL ${days} days
  ]
}

Make sure to generate exactly ${days} days in the itinerary array. This is very important!`;
};

// إنشاء chat session جديد لكل طلب
export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    // إنشاء chat session فريد لكل طلب
    const chatSession = model.startChat({
      generationConfig,
      history: [], // بدون history مسبق لتجنب التأثر بالأمثلة السابقة
    });

    const promptText = createTravelPrompt(location, days, traveler, budget);
    
    console.log("Generated Prompt:", promptText);
    console.log(`Requesting ${days} days for ${location}`);
    
    const result = await chatSession.sendMessage(promptText);
    const response = await result.response;
    const text = await response.text();
    
    console.log("Raw AI Response:", text);
    
    // محاولة تحليل الاستجابة
    try {
      const parsedResponse = JSON.parse(text);
      
      // التحقق من عدد الأيام المُنتجة
      const generatedDays = parsedResponse.itinerary?.length || 0;
      console.log(`Generated ${generatedDays} days out of ${days} requested`);
      
      if (generatedDays < parseInt(days)) {
        console.warn(`⚠️ AI generated only ${generatedDays} days instead of ${days} days`);
        
        // محاولة إضافية للحصول على الأيام الناقصة
        const missingDays = parseInt(days) - generatedDays;
        console.log(`Attempting to generate ${missingDays} missing days...`);
        
        // طلب إضافي للأيام الناقصة
        const additionalPrompt = `Continue the travel plan for ${location}. Generate additional ${missingDays} days starting from Day ${generatedDays + 1} to Day ${days}. 
        
        Follow the same format and include activities, places, and timing for each additional day.
        
        Return ONLY the additional days in this format:
        [
          {
            "day": "Day ${generatedDays + 1}",
            "plan": [...]
          }
          // ... continue to Day ${days}
        ]`;
        
        const additionalResult = await chatSession.sendMessage(additionalPrompt);
        const additionalResponse = await additionalResult.response;
        const additionalText = await additionalResponse.text();
        
        try {
          const additionalDays = JSON.parse(additionalText);
          if (Array.isArray(additionalDays)) {
            parsedResponse.itinerary = [...(parsedResponse.itinerary || []), ...additionalDays];
            console.log(`✅ Successfully added ${additionalDays.length} additional days`);
          }
        } catch (error) {
          console.error("Failed to parse additional days:", error);
        }
      }
      
      return parsedResponse;
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response that failed to parse:", text);
      return null;
    }
    
  } catch (error) {
    console.error("Error generating travel plan:", error);
    return null;
  }
};

// للحفاظ على التوافق مع الكود الموجود
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
    console.log("Prompt:", promptText);
    console.log("Raw Response:", result);
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};