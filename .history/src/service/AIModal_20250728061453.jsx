import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.7, // خففناها لضبط النتائج بدقة
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// ✅ توليد برومبت محسّن
const createTravelPrompt = (location, days, traveler, budget) => {
  return `
Generate a detailed travel plan for a trip to *${location}* for exactly *${days} days, customized for **${traveler}, with a **${budget}* budget.

🟢 IMPORTANT RULES:
- MUST generate exactly *${days}* days.
- Do NOT merge multiple days into one.
- Do NOT skip any days.
- Do NOT repeat locations or activities between days.
- Label each day clearly as "Day 1", "Day 2", ..., "Day ${days}".
- Each day should include 3 to 5 places or activities with approximate times (e.g. 10:00 AM, 2:30 PM).
- If not possible to generate exactly ${days} days, do not generate at all.

🟩 Response Format (JSON):
{
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Full Address",
      "price": "Price Range (e.g. $100-150/night)",
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
          "time": "10:00 AM",
          "placeName": "Place Name",
          "placeDetails": "Short details about the place",
          "placeImageUrl": "Image URL",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "$15 entry fee",
          "timeToTravel": "15 mins from previous"
        }
      ]
    }
    // Repeat for ALL ${days} days
  ]
}

Make sure the response is valid JSON. Do not include any extra text or explanation outside the JSON block.
  `;
};

// ✅ تنظيف النص من Markdown أو إضافات
const cleanJsonResponse = (text) => {
  return text
    .trim()
    .replace(/^json/, "")
    .replace(/$/, "")
    .trim();
};

// ✅ الدالة الأساسية لتوليد خطة الرحلة
export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const promptText = createTravelPrompt(location, days, traveler, budget);
    console.log("Generated Prompt:", promptText);
    console.log(Requesting ${days} days for ${location});

    const result = await chatSession.sendMessage(promptText);
    const response = await result.response;
    const rawText = await response.text();
    const cleanedText = cleanJsonResponse(rawText);

    console.log("Cleaned AI Response:", cleanedText);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch (err) {
      console.error("❌ Failed to parse response:", err);
      console.log("❌ Raw text that failed to parse:", rawText);
      return null;
    }

    const generatedDays = parsedResponse.itinerary?.length || 0;
    console.log(Generated ${generatedDays}/${days} days);

    // إذا عدد الأيام ناقص نحاول نكمله
    if (generatedDays < parseInt(days)) {
      const missingDays = parseInt(days) - generatedDays;
      console.warn(⚠ Missing ${missingDays} days. Requesting continuation...);

      const additionalPrompt = `
Continue the travel itinerary for ${location}.
Generate days from Day ${generatedDays + 1} to Day ${days}.
Same structure, no repetitions, valid JSON only.

Format:
[
  {
    "day": "Day ${generatedDays + 1}",
    "plan": [...]
  },
  ...
]
      `;

      const additionalResult = await chatSession.sendMessage(additionalPrompt);
      const additionalResponse = await additionalResult.response;
      const additionalText = cleanJsonResponse(await additionalResponse.text());

      try {
        const additionalDays = JSON.parse(additionalText);
        if (Array.isArray(additionalDays)) {
          parsedResponse.itinerary = [...(parsedResponse.itinerary || []), ...additionalDays];
          console.log(✅ Added ${additionalDays.length} extra days. Final total: ${parsedResponse.itinerary.length});
        }
      } catch (e) {
        console.error("❌ Failed to parse additional days:", e);
      }
    }

    return parsedResponse;
  } catch (error) {
    console.error("🔥 Error generating travel plan:", error);
    return null;
  }
};

// ✅ للتوافق أو إرسال مباشر للنموذج
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