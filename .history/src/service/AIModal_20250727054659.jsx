import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.5, // Further reduced for more consistent output
  topP: 0.9,
  topK: 30, // More focused responses
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

/**
 * ULTRA STRICT travel prompt with aggressive requirements and threats
 */
const createTravelPrompt = (location, days, traveler, budget, attempt = 1) => {
  const targetDays = parseInt(days);
  const daysList = Array.from({length: targetDays}, (_, i) => `Day ${i + 1}`).join(', ');
  const minHotels = Math.max(3, Math.ceil(targetDays / 4)); // At least 3 hotels
  
  return `🚨 GENERATE TRAVEL PLAN FOR ${location} 🚨

⚠️ CRITICAL WARNINGS - FAILURE TO COMPLY WILL RESULT IN REJECTION:
❌ If the itinerary does not contain EXACTLY ${targetDays} days, your response will be discarded as invalid.
❌ If hotels array contains less than ${minHotels} different hotels, your response will be rejected.
❌ Any response not following the exact JSON structure will be completely ignored.
❌ Responses with incorrect day numbering will be automatically discarded.

🎯 MANDATORY REQUIREMENTS (NO EXCEPTIONS):
- Duration: EXACTLY ${targetDays} days (COUNT: ${daysList})
- Hotels: MINIMUM ${minHotels} different hotels with unique names and addresses
- Traveler: ${traveler}
- Budget: ${budget}
- Attempt: ${attempt}/3

🔢 EXACT DAY COUNT VERIFICATION:
Your itinerary MUST contain these EXACT days: ${daysList}
- First day: "Day 1"
- Last day: "Day ${targetDays}" 
- Total count: ${targetDays} objects in itinerary array

🏨 HOTEL REQUIREMENTS (STRICTLY ENFORCED):
- Generate EXACTLY ${minHotels} OR MORE different hotels
- Each hotel MUST have a completely different name
- Each hotel MUST have a different address
- Include variety: budget, mid-range, luxury options
- NO duplicate hotel names allowed

📋 MANDATORY JSON STRUCTURE (EXACT FORMAT REQUIRED):
{
  "hotels": [
    ${Array.from({length: minHotels}, (_, i) => `
    {
      "hotelName": "Unique Hotel Name ${i + 1} in ${location}",
      "hotelAddress": "Different Address ${i + 1}, ${location}",
      "price": "$${50 + (i * 40)}-${120 + (i * 60)} per night",
      "hotelImageUrl": "https://example.com/hotel${i + 1}.jpg",
      "geoCoordinates": "latitude,longitude",
      "rating": "${(3.5 + (i * 0.4)).toFixed(1)}",
      "description": "Detailed hotel description"
    }${i < minHotels - 1 ? ',' : ''}`).join('')}
  ],
  "itinerary": [
    ${Array.from({length: targetDays}, (_, i) => `
    {
      "day": "Day ${i + 1}",
      "plan": [
        {
          "time": "09:00 AM",
          "placeName": "Morning Activity ${location}",
          "placeDetails": "Detailed description of morning activity",
          "placeImageUrl": "https://example.com/place${i + 1}.jpg",
          "geoCoordinates": "latitude,longitude",
          "ticketPricing": "$XX or Free",
          "timeToTravel": "X minutes"
        },
        {
          "time": "02:00 PM",
          "placeName": "Afternoon Activity ${location}",
          "placeDetails": "Detailed description of afternoon activity",
          "placeImageUrl": "https://example.com/place${i + 1}b.jpg",
          "geoCoordinates": "latitude,longitude",
          "ticketPricing": "$XX or Free",
          "timeToTravel": "X minutes"
        },
        {
          "time": "07:00 PM",
          "placeName": "Evening Activity ${location}",
          "placeDetails": "Detailed description of evening activity",
          "placeImageUrl": "https://example.com/place${i + 1}c.jpg",
          "geoCoordinates": "latitude,longitude",
          "ticketPricing": "$XX or Free",
          "timeToTravel": "X minutes"
        }
      ]
    }${i < targetDays - 1 ? ',' : ''}`).join('')}
  ]
}

🚨 FINAL MANDATORY VERIFICATION BEFORE SUBMISSION:
1. Count itinerary objects: 1, 2, 3... ${targetDays} ✓ (MUST EQUAL ${targetDays})
2. Verify last day is "Day ${targetDays}" ✓
3. Count hotels: MUST BE AT LEAST ${minHotels} ✓
4. All hotel names are different ✓
5. JSON is valid and complete ✓

⚠️ FAILURE CONSEQUENCES:
- Wrong day count = AUTOMATIC REJECTION
- Insufficient hotels = AUTOMATIC REJECTION  
- Invalid JSON = AUTOMATIC REJECTION
- Missing data = AUTOMATIC REJECTION

Generate the travel plan NOW with EXACTLY ${targetDays} days and AT LEAST ${minHotels} hotels:`;
};

/**
 * ULTRA STRICT generateTravelPlan with aggressive validation
 */
export const generateTravelPlan = async (location, days, traveler, budget, retryCount = 0) => {
  const maxRetries = 4; // Increased retries
  const targetDays = parseInt(days);
  const minHotels = Math.max(3, Math.ceil(targetDays / 4));
  
  console.log(`🎯 AI Trip Generation - Attempt ${retryCount + 1}/${maxRetries + 1}`);
  console.log(`📍 Location: ${location}`);
  console.log(`📅 Target Days: ${targetDays} (EXACT REQUIREMENT)`);
  console.log(`🏨 Minimum Hotels: ${minHotels} (STRICT REQUIREMENT)`);
  console.log(`👥 Traveler: ${traveler}`);
  console.log(`💰 Budget: ${budget}`);

  try {
    // Create fresh session with reduced temperature for more consistency
    const chatSession = model.startChat({
      generationConfig: {
        ...generationConfig,
        temperature: Math.max(0.2, generationConfig.temperature - (retryCount * 0.1))
      },
      history: [],
    });

    const promptText = createTravelPrompt(location, targetDays, traveler, budget, retryCount + 1);
    
    console.log(`📝 Sending STRICT prompt to AI (${promptText.length} characters)`);
    
    const result = await chatSession.sendMessage(promptText);
    const response = await result.response;
    const text = await response.text();
    
    console.log(`📥 Raw AI Response received (${text.length} characters)`);
    
    // Enhanced JSON parsing
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError);
      
      // Try to extract JSON from wrapped response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log("🔧 Extracting JSON from wrapped response...");
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log("✅ Successfully extracted JSON");
        } catch (secondError) {
          console.error("❌ Failed to extract JSON:", secondError);
          if (retryCount < maxRetries) {
            console.log("🔄 Retrying due to JSON parse error...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
          }
          throw new Error(`Failed to parse AI response after ${maxRetries + 1} attempts`);
        }
      } else {
        if (retryCount < maxRetries) {
          console.log("🔄 Retrying due to no valid JSON found...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
        }
        throw new Error(`No valid JSON found in AI response after ${maxRetries + 1} attempts`);
      }
    }
    
    // STRICT VALIDATION - NO COMPROMISE
    if (!parsedResponse || !parsedResponse.itinerary || !Array.isArray(parsedResponse.itinerary)) {
      console.error("❌ VALIDATION FAILED: Invalid itinerary structure");
      if (retryCount < maxRetries) {
        console.log("🔄 Retrying due to invalid itinerary structure...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
      }
      throw new Error("Invalid response structure: missing or invalid itinerary array");
    }
    
    if (!parsedResponse.hotels || !Array.isArray(parsedResponse.hotels)) {
      console.error("❌ VALIDATION FAILED: Invalid hotels structure");
      if (retryCount < maxRetries) {
        console.log("🔄 Retrying due to invalid hotels structure...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
      }
      throw new Error("Invalid response structure: missing or invalid hotels array");
    }
    
    const generatedDays = parsedResponse.itinerary.length;
    const generatedHotels = parsedResponse.hotels.length;
    
    console.log(`📊 VALIDATION CHECK:`);
    console.log(`   Days: ${generatedDays}/${targetDays} ${generatedDays === targetDays ? '✅' : '❌'}`);
    console.log(`   Hotels: ${generatedHotels}/${minHotels} ${generatedHotels >= minHotels ? '✅' : '❌'}`);
    
    // STRICT REQUIREMENTS - EXACT MATCH REQUIRED
    const exactDaysMatch = generatedDays === targetDays;
    const sufficientHotels = generatedHotels >= minHotels;
    
    if (exactDaysMatch && sufficientHotels) {
      console.log("🎉 VALIDATION PASSED! Exact requirements met");
      
      // Fix day numbering if needed
      parsedResponse.itinerary.forEach((day, index) => {
        const expectedDay = `Day ${index + 1}`;
        if (day.day !== expectedDay) {
          console.warn(`⚠️ Fixing day: "${day.day}" → "${expectedDay}"`);
          day.day = expectedDay;
        }
      });
      
      // Validate each day has activities
      const validDays = parsedResponse.itinerary.every(day => 
        day.plan && Array.isArray(day.plan) && day.plan.length > 0
      );
      
      if (!validDays) {
        console.error("❌ VALIDATION FAILED: Some days have no activities");
        if (retryCount < maxRetries) {
          console.log("🔄 Retrying due to empty day plans...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
        }
      }
      
      return {
        ...parsedResponse,
        metadata: {
          generatedDays,
          targetDays,
          generatedHotels,
          minHotels,
          success: true,
          attempt: retryCount + 1,
          completeness: 100,
          validation: 'PASSED'
        }
      };
    }
    
    // STRICT ENFORCEMENT - RETRY IF REQUIREMENTS NOT MET
    if (retryCount < maxRetries) {
      const reasons = [];
      if (!exactDaysMatch) reasons.push(`day count mismatch (${generatedDays}≠${targetDays})`);
      if (!sufficientHotels) reasons.push(`insufficient hotels (${generatedHotels}<${minHotels})`);
      
      console.log(`🔄 RETRYING due to: ${reasons.join(', ')}`);
      console.log(`   This is unacceptable. Requirement is EXACT ${targetDays} days and ≥${minHotels} hotels.`);
      
      await new Promise(resolve => setTimeout(resolve, 1500 + (retryCount * 500)));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    // LAST RESORT - FIX MANUALLY AFTER ALL RETRIES
    console.log(`⚠️ LAST RESORT: Manually fixing after ${maxRetries + 1} failed attempts`);
    
    // Force correct number of days
    if (generatedDays !== targetDays) {
      console.log(`🔧 FORCE FIXING days: ${generatedDays} → ${targetDays}`);
      
      if (generatedDays < targetDays) {
        // Add missing days
        for (let i = generatedDays; i < targetDays; i++) {
          parsedResponse.itinerary.push({
            day: `Day ${i + 1}`,
            plan: [
              {
                time: "09:00 AM",
                placeName: `Explore ${location} - Day ${i + 1}`,
                placeDetails: `Continue your journey in ${location} with local exploration and cultural experiences`,
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: "Variable",
                timeToTravel: "Flexible"
              },
              {
                time: "02:00 PM",
                placeName: `Local Experience in ${location}`,
                placeDetails: `Immerse yourself in the local culture and cuisine of ${location}`,
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: "Variable",
                timeToTravel: "Flexible"
              },
              {
                time: "07:00 PM",
                placeName: `Evening Activities in ${location}`,
                placeDetails: `Enjoy evening entertainment and nightlife in ${location}`,
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: "Variable",
                timeToTravel: "Flexible"
              }
            ]
          });
        }
      } else if (generatedDays > targetDays) {
        // Remove excess days
        parsedResponse.itinerary = parsedResponse.itinerary.slice(0, targetDays);
      }
    }
    
    // Force correct number of hotels
    if (generatedHotels < minHotels) {
      console.log(`🔧 FORCE FIXING hotels: ${generatedHotels} → ${minHotels}`);
      
      const hotelTypes = ['Budget Hotel', 'Mid-Range Hotel', 'Luxury Hotel', 'Boutique Hotel', 'Business Hotel', 'Resort Hotel'];
      const priceRanges = ['$50-80', '$80-120', '$120-200', '$200-300', '$100-150', '$150-250'];
      
      for (let i = generatedHotels; i < minHotels; i++) {
        const hotelType = hotelTypes[i % hotelTypes.length];
        const priceRange = priceRanges[i % priceRanges.length];
        
        parsedResponse.hotels.push({
          hotelName: `${hotelType} ${location} ${i + 1}`,
          hotelAddress: `${location} District ${i + 1}, ${location}`,
          price: `${priceRange} per night`,
          hotelImageUrl: "",
          geoCoordinates: "",
          rating: `${(3.5 + (i * 0.3)).toFixed(1)}`,
          description: `Comfortable ${hotelType.toLowerCase()} in ${location} offering excellent amenities and service for ${traveler.toLowerCase()} travelers.`
        });
      }
    }
    
    const finalDays = parsedResponse.itinerary.length;
    const finalHotels = parsedResponse.hotels.length;
    
    console.log(`✅ FINAL RESULT: ${finalDays} days, ${finalHotels} hotels`);
    
    return {
      ...parsedResponse,
      metadata: {
        generatedDays: finalDays,
        targetDays,
        generatedHotels: finalHotels,
        minHotels,
        success: finalDays === targetDays && finalHotels >= minHotels,
        attempt: retryCount + 1,
        completeness: finalDays === targetDays && finalHotels >= minHotels ? 100 : 85,
        validation: 'MANUALLY_FIXED'
      }
    };
    
  } catch (error) {
    console.error(`💥 Error in attempt ${retryCount + 1}:`, error);
    
    // Retry on network/API errors
    if (retryCount < maxRetries && (
      error.message.includes('network') || 
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('rate limit')
    )) {
      console.log(`🔄 Retrying due to network/API error...`);
      await new Promise(resolve => setTimeout(resolve, 2000 + (retryCount * 1000)));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    console.error(`❌ FINAL FAILURE after ${retryCount + 1} attempts`);
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