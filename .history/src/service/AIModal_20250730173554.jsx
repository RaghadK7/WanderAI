import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Models in priority order (newest to oldest)
const MODELS = [
  "gemini-2.5-flash",      // Latest and fastest
  "gemini-2.0-flash",      // Strong alternative
  "gemini-1.5-flash",      // Current model
  "gemini-1.5-pro"         // Slower but more accurate
];

const generationConfig = {
  temperature: 0.3,        // Lower for more consistent JSON
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const createTravelPrompt = (location, days, traveler, budget) => {
  return `You are a professional travel planner. Generate a complete ${days}-day travel itinerary for ${location}.

CRITICAL REQUIREMENTS:
- Generate EXACTLY ${days} days, no more, no less
- Each day must be numbered: Day 1, Day 2, Day 3... up to Day ${days}
- Each day must have 3-5 different activities with specific times
- Budget: ${budget}, Traveler type: ${traveler}
- Return ONLY valid JSON, no markdown, no explanations

JSON STRUCTURE (mandatory):
{
  "hotels": [
    {
      "hotelName": "Exact hotel name",
      "hotelAddress": "Complete address with city",
      "price": "$XX-XX/night",
      "hotelImageUrl": "https://example.com/image.jpg",
      "geoCoordinates": "latitude,longitude",
      "rating": "X.X",
      "description": "Brief description in 20 words"
    }
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "plan": [
        {
          "time": "9:00 AM",
          "placeName": "Specific place name",
          "placeDetails": "What to do there in 25 words",
          "placeImageUrl": "https://example.com/place.jpg",
          "geoCoordinates": "latitude,longitude",
          "ticketPricing": "$XX or Free",
          "timeToTravel": "XX mins"
        }
      ]
    }
  ]
}

VALIDATION RULES:
- Hotels array: minimum 4 hotels
- Itinerary array: EXACTLY ${days} objects
- Each day: 3-5 activities minimum
- All strings must be properly escaped
- All coordinates must be real numbers
- All URLs must be valid format

Generate complete JSON for all ${days} days now:`;
};

const createContinuePrompt = (location, startDay, endDay, existingDays) => {
  return `Continue the travel itinerary for ${location}. 

CRITICAL: Generate days ${startDay} to ${endDay} only.
Do NOT repeat any activities from previous days.
Return ONLY the missing days as JSON array.

Previous activities to avoid: ${existingDays.map(d => d.plan.map(p => p.placeName).join(', ')).join(' | ')}

JSON FORMAT (array of day objects):
[
  {
    "day": "Day ${startDay}",
    "plan": [
      {
        "time": "9:00 AM",
        "placeName": "NEW unique place",
        "placeDetails": "Different activity description",
        "placeImageUrl": "https://example.com/image.jpg",
        "geoCoordinates": "latitude,longitude",
        "ticketPricing": "$XX",
        "timeToTravel": "XX mins"
      }
    ]
  }
]

Generate exactly ${endDay - startDay + 1} days from Day ${startDay} to Day ${endDay}:`;
};

const cleanAndValidateJSON = (text) => {
  try {
    // Remove markdown formatting
    let cleaned = text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .replace(/^json\s*/i, '')
      .trim();

    // Find JSON boundaries
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      throw new Error('No valid JSON boundaries found');
    }
    
    cleaned = cleaned.substring(startIdx, endIdx + 1);
    
    // Attempt to parse
    const parsed = JSON.parse(cleaned);
    
    // Validate structure
    if (!parsed.hotels || !Array.isArray(parsed.hotels)) {
      throw new Error('Invalid hotels array');
    }
    
    if (!parsed.itinerary || !Array.isArray(parsed.itinerary)) {
      throw new Error('Invalid itinerary array');
    }
    
    return { success: true, data: parsed };
    
  } catch (error) {
    console.error('JSON parsing failed:', error.message);
    return { success: false, error: error.message, rawText: text };
  }
};

const tryModelsSequentially = async (promptText, maxRetries = 3) => {
  for (const modelName of MODELS) {
    console.log(`🔄 Trying model: ${modelName}`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const rawText = await response.text();
        
        console.log(`✅ Model ${modelName} succeeded on attempt ${attempt}`);
        return { success: true, data: rawText, modelUsed: modelName };
        
      } catch (error) {
        console.log(`❌ Model ${modelName} failed - attempt ${attempt}:`, error.message);
        
        if (error.status === 503 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (error.status === 429) {
          console.log(`⚠️ Rate limit for ${modelName} - trying next model`);
          break;
        }
        
        if (error.message.includes('not found') || error.status === 404) {
          console.log(`⚠️ Model ${modelName} not available - trying next`);
          break;
        }
        
        if (attempt === maxRetries) {
          console.log(`💥 Model ${modelName} failed completely after ${maxRetries} attempts`);
          break;
        }
      }
    }
  }
  
  return { success: false, error: "All models failed or unavailable" };
};

export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    console.log(`🚀 Starting travel plan generation: ${location} for ${days} days`);
    
    // First attempt: Generate complete itinerary
    const promptText = createTravelPrompt(location, days, traveler, budget);
    const result = await tryModelsSequentially(promptText);
    
    if (!result.success) {
      console.error("🔥 All models failed:", result.error);
      return null;
    }
    
    console.log(`✅ Generation successful using: ${result.modelUsed}`);
    
    // Parse and validate JSON
    const parseResult = cleanAndValidateJSON(result.data);
    
    if (!parseResult.success) {
      console.error("🔥 JSON parsing failed:", parseResult.error);
      console.log("Raw response:", parseResult.rawText?.substring(0, 500) + "...");
      return null;
    }
    
    let parsed = parseResult.data;
    let generated = parsed.itinerary?.length || 0;
    
    console.log(`📊 Generated ${generated} days out of requested ${days} days`);

    // If days are missing, generate them separately
    if (generated < days) {
      const missing = days - generated;
      console.log(`📝 Generating ${missing} missing days (${generated + 1} to ${days})`);

      const continuePrompt = createContinuePrompt(location, generated + 1, days, parsed.itinerary || []);
      const extraResult = await tryModelsSequentially(continuePrompt);
      
      if (extraResult.success) {
        try {
          // Parse as array of days
          const extraClean = extraResult.data.trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
          
          const extraDays = JSON.parse(extraClean);
          
          if (Array.isArray(extraDays) && extraDays.length > 0) {
            parsed.itinerary = [...(parsed.itinerary || []), ...extraDays];
            console.log(`✅ Added ${extraDays.length} additional days`);
          } else {
            console.warn("⚠️ Extra days not in expected array format");
          }
        } catch (e) {
          console.error("❌ Failed to parse additional days:", e);
        }
      } else {
        console.warn("⚠️ Failed to generate missing days");
      }
    }

    // Final validation
    const finalGenerated = parsed.itinerary?.length || 0;
    console.log(`🎯 Final result: ${finalGenerated}/${days} days generated`);
    
    if (finalGenerated < days) {
      console.warn(`⚠️ Warning: Only generated ${finalGenerated} out of ${days} requested days`);
    }

    return parsed;
    
  } catch (err) {
    console.error("🔥 General error in trip generation:", err);
    return null;
  }
};

// Updated chat system
let currentModel = null;

const initializeBestModel = async () => {
  if (currentModel) return currentModel;
  
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      await model.generateContent("test");
      currentModel = model;
      console.log(`✅ Initialized model: ${modelName}`);
      return model;
    } catch (error) {
      console.log(`❌ Failed to initialize model: ${modelName}`);
      continue;
    }
  }
  
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
    console.error("❌ Send message error:", err);
    
    const fallbackResult = await tryModelsSequentially(promptText);
    if (fallbackResult.success) {
      return fallbackResult.data;
    }
    
    return null;
  }
};