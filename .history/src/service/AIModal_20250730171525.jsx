import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// قائمة النماذج بترتيب الأولوية (من الأحدث للأقدم)
const MODELS = [
  "gemini-2.5-flash",      // الأحدث والأسرع
  "gemini-2.0-flash",      // بديل قوي
  "gemini-1.5-flash",      // النموذج الحالي
  "gemini-1.5-pro"         // أبطأ لكن أكثر دقة
];

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const createTravelPrompt = (location, days, traveler, budget) => {
  return `
Generate a detailed travel plan for a trip to ${location} for exactly ${days} days, customized for ${traveler}, with a ${budget} budget.

RULES:
- MUST generate exactly ${days} days.
- Do NOT merge days or skip any.
- No repetition between days.
- Label each day clearly as "Day 1", "Day 2", ..., "Day ${days}".
- Each day must include 3 to 5 unique activities with times (e.g. 9:00 AM).
- If not possible to generate ${days} days, do NOT generate anything.
Include:
1. Hotels (4+ options): Each must have name, address, price, rating, geo coordinates, image URL, and short description.
2. Itinerary: Each day with time-stamped locations, place name, details, ticket price, image URL, geo coordinates, and time to travel.

RESPONSE FORMAT (JSON only):
{
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Full Address",
      "price": "$100-150/night",
      "hotelImageUrl": "Image URL",
      "geoCoordinates": "lat,lng",
      "rating": "4.5",
      "description": "Short description"
    }
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "plan": [
        {
          "time": "9:00 AM",
          "placeName": "Place Name",
          "placeDetails": "Short description",
          "placeImageUrl": "Image URL",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "$15 entry",
          "timeToTravel": "60 mins"
        }
      ]
    }
    // Repeat until Day ${days}
  ]
}
ONLY return valid JSON. No extra explanation.`;
};

const cleanJsonResponse = (text) => {
  return text.trim().replace(/^json/, "").replace(/```/g, "").trim();
};

// دالة تجربة النماذج بالتسلسل
const tryModelsSequentially = async (promptText, maxRetries = 3) => {
  for (const modelName of MODELS) {
    console.log(`🔄 جاري تجربة النموذج: ${modelName}`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({ generationConfig, history: [] });
        
        const result = await chat.sendMessage(promptText);
        const response = await result.response;
        const rawText = await response.text();
        
        console.log(`✅ نجح النموذج: ${modelName} في المحاولة ${attempt}`);
        return { success: true, data: rawText, modelUsed: modelName };
        
      } catch (error) {
        console.log(`❌ فشل النموذج: ${modelName} - المحاولة ${attempt}:`, error.message);
        
        if (error.status === 503 && attempt < maxRetries) {
          // خطأ الخدمة محملة - انتظار متدرج
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ انتظار ${waitTime/1000} ثانية قبل إعادة المحاولة...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (error.status === 429) {
          // تجاوز الحد - جرب النموذج التالي
          console.log(`⚠️ تجاوز الحد للنموذج ${modelName} - الانتقال للتالي`);
          break;
        }
        
        if (error.message.includes('not found') || error.status === 404) {
          // النموذج غير متاح - جرب التالي
          console.log(`⚠️ النموذج ${modelName} غير متاح - الانتقال للتالي`);
          break;
        }
        
        // أخطاء أخرى - أعد المحاولة
        if (attempt === maxRetries) {
          console.log(`💥 فشل النموذج ${modelName} نهائياً بعد ${maxRetries} محاولات`);
          break;
        }
      }
    }
  }
  
  return { success: false, error: "جميع النماذج فشلت أو غير متاحة" };
};

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    console.log(`🚀 بدء توليد خطة السفر: ${location} لمدة ${days} أيام`);
    
    const promptText = createTravelPrompt(location, days, traveler, budget);
    const result = await tryModelsSequentially(promptText);
    
    if (!result.success) {
      console.error("🔥 فشل في جميع النماذج:", result.error);
      return null;
    }
    
    console.log(`✅ تم التوليد بنجاح باستخدام: ${result.modelUsed}`);
    
    const cleanedText = cleanJsonResponse(result.data);
    let parsed = JSON.parse(cleanedText);
    let generated = parsed.itinerary?.length || 0;

    // إذا كانت الأيام ناقصة، أكمل بنفس النموذج الناجح
    if (generated < days) {
      const missing = days - generated;
      console.log(`📝 إكمال ${missing} أيام متبقية...`);

      const continuePrompt = `
Continue the travel itinerary for ${location}.
Generate days from Day ${generated + 1} to Day ${days}.
Same format, no repeats. Valid JSON only:
[
  {
    "day": "Day ${generated + 1}",
    "plan": [...]
  }
]
`;

      const extraResult = await tryModelsSequentially(continuePrompt);
      
      if (extraResult.success) {
        try {
          const extraClean = cleanJsonResponse(extraResult.data);
          const extraDays = JSON.parse(extraClean);
          if (Array.isArray(extraDays)) {
            parsed.itinerary = [...(parsed.itinerary || []), ...extraDays];
          }
        } catch (e) {
          console.error("❌ فشل في تحليل الأيام الإضافية:", e);
        }
      }
    }

    return parsed;
  } catch (err) {
    console.error("🔥 خطأ عام في توليد الرحلة:", err);
    return null;
  }
};

// نظام المحادثة المحدث
let currentModel = null;

const initializeBestModel = async () => {
  if (currentModel) return currentModel;
  
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      // اختبار سريع
      await model.generateContent("test");
      currentModel = model;
      console.log(`✅ تم تهيئة النموذج: ${modelName}`);
      return model;
    } catch (error) {
      console.log(`❌ فشل تهيئة النموذج: ${modelName}`);
      continue;
    }
  }
  
  // إذا فشلت جميع النماذج، استخدم الافتراضي
  currentModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  return currentModel;
};

export const chatSession = {
  sendMessage: async (promptText) => {
    const model = await initializeBestModel();
    const chat = model.startChat({ generationConfig, history: [] });
    const result = await chat.sendMessage(promptText);
    const response = await result.response;
    return await response.text();
  },
};

export const sendMessage = async (promptText) => {
  try {
    const result = await chatSession.sendMessage(promptText);
    return result;
  } catch (err) {
    console.error("❌ خطأ في إرسال الرسالة:", err);
    
    // جرب مع نظام المحاولات المتعددة
    const fallbackResult = await tryModelsSequentially(promptText);
    if (fallbackResult.success) {
      return fallbackResult.data;
    }
    
    return null;
  }
};