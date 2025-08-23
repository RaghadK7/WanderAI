import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.7, // Reduced for more consistent output
  topP: 0.95,
  topK: 40, // Reduced for more focused responses
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

/**
 * Enhanced travel prompt with stronger day requirements
 * Uses multiple reinforcement techniques to ensure exact day count
 */
const createTravelPrompt = (location, days, traveler, budget, attempt = 1) => {
  const daysList = Array.from({length: days}, (_, i) => `Day ${i + 1}`).join(', ');
  
  return `Generate a comprehensive travel plan for ${location}.

🎯 CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:
- Duration: EXACTLY ${days} days (not ${days-1}, not ${days+1}, but EXACTLY ${days})
- Generate itinerary for: ${daysList}
- Each day must be numbered: "Day 1", "Day 2", "Day 3"... up to "Day ${days}"
- Traveler type: ${traveler}
- Budget level: ${budget}
- Attempt: ${attempt}/3

⚠️ VALIDATION CHECKLIST:
✓ Does your itinerary array have exactly ${days} objects?
✓ Are days numbered from Day 1 to Day ${days}?
✓ Does each day have 3-5 meaningful activities?
✓ Are all locations relevant to ${location}?

📋 REQUIRED OUTPUT STRUCTURE:
{
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Complete Address with City, Country",
      "price": "$XX-XX per night",
      "hotelImageUrl": "https://example.com/image.jpg",
      "geoCoordinates": "latitude,longitude",
      "rating": "X.X",
      "description": "Detailed description"
    }
  ],
  "itinerary": [
    ${Array.from({length: days}, (_, i) => `
    {
      "day": "Day ${i + 1}",
      "plan": [
        {
          "time": "HH:MM AM/PM",
          "placeName": "Specific Place Name",
          "placeDetails": "Detailed description with historical/cultural context",
          "placeImageUrl": "https://example.com/place-image.jpg",
          "geoCoordinates": "latitude,longitude",
          "ticketPricing": "$XX or Free",
          "timeToTravel": "X hours/minutes from previous location"
        }
      ]
    }${i < days - 1 ? ',' : ''}`).join('')}
  ]
}

🚨 FINAL CHECK: Your response must contain EXACTLY ${days} day objects in the itinerary array. Count them before submitting!

Generate the complete travel plan now:`;
};

/**
 * Enhanced generateTravelPlan with improved retry logic
 * Uses multiple strategies to ensure correct day count
 */
export const generateTravelPlan = async (location, days, traveler, budget, retryCount = 0) => {
  const maxRetries = 3;
  const targetDays = parseInt(days);
  
  console.log(`🎯 AI Trip Generation - Attempt ${retryCount + 1}/${maxRetries + 1}`);
  console.log(`📍 Location: ${location}`);
  console.log(`📅 Target Days: ${targetDays}`);
  console.log(`👥 Traveler: ${traveler}`);
  console.log(`💰 Budget: ${budget}`);

  try {
    // Create fresh chat session for each attempt
    const chatSession = model.startChat({
      generationConfig: {
        ...generationConfig,
        temperature: Math.max(0.3, generationConfig.temperature - (retryCount * 0.1)) // Reduce randomness with retries
      },
      history: [], // Fresh session to avoid context pollution
    });

    const promptText = createTravelPrompt(location, targetDays, traveler, budget, retryCount + 1);
    
    console.log(`📝 Sending prompt to AI (${promptText.length} characters)`);
    
    const result = await chatSession.sendMessage(promptText);
    const response = await result.response;
    const text = await response.text();
    
    console.log(`📥 Raw AI Response (${text.length} characters):`, text.substring(0, 500) + '...');
    
    // Enhanced parsing with better error handling
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError);
      
      // Try to extract JSON from response if it's wrapped in other text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log("🔧 Attempting to extract JSON from wrapped response...");
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log("✅ Successfully extracted JSON from wrapped response");
        } catch (secondError) {
          console.error("❌ Failed to extract JSON:", secondError);
          throw new Error(`Failed to parse AI response: ${parseError.message}`);
        }
      } else {
        throw new Error(`No valid JSON found in AI response: ${parseError.message}`);
      }
    }
    
    // Validate response structure
    if (!parsedResponse || !parsedResponse.itinerary || !Array.isArray(parsedResponse.itinerary)) {
      throw new Error("Invalid response structure: missing or invalid itinerary array");
    }
    
    const generatedDays = parsedResponse.itinerary.length;
    console.log(`📊 Generated Days: ${generatedDays}/${targetDays}`);
    
    // Check if we got the exact number of days
    if (generatedDays === targetDays) {
      console.log("🎉 Perfect! Got exact number of days requested");
      
      // Validate day numbering
      const validDays = parsedResponse.itinerary.every((day, index) => {
        const expectedDay = `Day ${index + 1}`;
        const actualDay = day.day;
        if (actualDay !== expectedDay) {
          console.warn(`⚠️ Day numbering issue: Expected "${expectedDay}", got "${actualDay}"`);
          // Fix the day numbering
          day.day = expectedDay;
        }
        return day.plan && Array.isArray(day.plan) && day.plan.length > 0;
      });
      
      if (validDays) {
        console.log("✅ All days validated successfully");
        return {
          ...parsedResponse,
          metadata: {
            generatedDays,
            targetDays,
            success: true,
            attempt: retryCount + 1,
            completeness: 100
          }
        };
      }
    }
    
    // If we don't have exact days and haven't exceeded retries, try again
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying due to incorrect day count (${generatedDays}/${targetDays})`);
      
      // Wait before retry to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500)));
      
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    // If we've exhausted retries, work with what we have
    console.log(`⚠️ Using partial result after ${maxRetries + 1} attempts`);
    
    // Try to fill missing days with simplified content
    if (generatedDays < targetDays && generatedDays > 0) {
      console.log(`🔧 Attempting to fill ${targetDays - generatedDays} missing days`);
      
      const lastDay = parsedResponse.itinerary[generatedDays - 1];
      for (let i = generatedDays; i < targetDays; i++) {
        parsedResponse.itinerary.push({
          day: `Day ${i + 1}`,
          plan: [
            {
              time: "9:00 AM",
              placeName: `Explore ${location} - Additional Activities`,
              placeDetails: `Continue exploring ${location} with free time for personal discoveries`,
              placeImageUrl: "",
              geoCoordinates: "",
              ticketPricing: "Free",
              timeToTravel: "Flexible"
            },
            {
              time: "2:00 PM",
              placeName: `Local Experience in ${location}`,
              placeDetails: `Enjoy local cuisine and culture in ${location}`,
              placeImageUrl: "",
              geoCoordinates: "",
              ticketPricing: "Variable",
              timeToTravel: "Flexible"
            }
          ]
        });
      }
      console.log(`✅ Filled missing days with basic activities`);
    }
    
    const finalDays = parsedResponse.itinerary.length;
    const completeness = Math.round((finalDays / targetDays) * 100);
    
    return {
      ...parsedResponse,
      metadata: {
        generatedDays: finalDays,
        targetDays,
        success: finalDays >= Math.ceil(targetDays * 0.8), // 80% threshold
        attempt: retryCount + 1,
        completeness
      }
    };
    
  } catch (error) {
    console.error(`💥 Error in attempt ${retryCount + 1}:`, error);
    
    // If we haven't exceeded retries and it's a network/API error, try again
    if (retryCount < maxRetries && (
      error.message.includes('network') || 
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    )) {
      console.log(`🔄 Retrying due to network error...`);
      await new Promise(resolve => setTimeout(resolve, 2000 + (retryCount * 1000)));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    // Final failure
    console.error(`❌ Final failure after ${retryCount + 1} attempts`);
    throw error;
  }
};

/**
 * Legacy function for backward compatibility
 */
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

/**
 * Legacy sendMessage function
 */
export const sendMessage = async (promptText) => {
  try {
    const result = await chatSession.sendMessage(promptText);
    console.log("📝 Prompt:", promptText.substring(0, 200) + '...');
    console.log("📥 Response:", typeof result === 'string' ? result.substring(0, 200) + '...' : result);
    return result;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return null;
  }
};