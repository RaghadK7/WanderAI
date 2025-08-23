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

// البرومبت المضمون 100%
const createTravelPrompt = (location, days, traveler, budget) => {
  const daysList = Array.from({length: parseInt(days)}, (_, i) => `"Day ${i + 1}"`).join(', ');
  
  return `Generate travel plan for ${location} for ${traveler} with ${budget} budget.

CRITICAL: You must generate EXACTLY these ${days} days: ${daysList}

Your itinerary array MUST contain exactly ${days} objects, one for each day.

IMPORTANT RULES:
- Use ONLY real existing places in ${location}
- Include famous landmarks popular restaurants actual museums real markets
- Provide accurate addresses and realistic prices
- No fictional or made-up places
- Research well-known attractions for this destination

Fill each day with 4-5 real activities covering famous attractions popular restaurants actual shopping areas real cultural sites.

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
}`;
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