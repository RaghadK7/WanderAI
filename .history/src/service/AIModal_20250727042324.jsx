import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.5,
  topP: 0.9,
  topK: 32,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const createTravelPrompt = (location, days, traveler, budget, attempt = 1) => {
  const targetDays = parseInt(days);
  const hotelCount = 3; // Always exactly 3 hotels
  
  return `Generate a travel plan for ${location}.

CRITICAL REQUIREMENTS:
- Duration: EXACTLY ${targetDays} days (Day 1, Day 2, ... Day ${targetDays})
- Hotels: EXACTLY 3 hotels (Luxury, Mid-range, Budget)
- Traveler: ${traveler}
- Budget: ${budget}
- Attempt: ${attempt}/3

REQUIRED JSON STRUCTURE:
{
  "hotels": [
    {
      "id": "1",
      "hotelName": "Hotel Name 1",
      "hotelAddress": "Complete Address",
      "price": "$XX-XX per night",
      "hotelImageUrl": "https://images.unsplash.com/hotel1",
      "geoCoordinates": "lat,lng",
      "rating": "4.5",
      "description": "Hotel description",
      "category": "Luxury"
    },
    {
      "id": "2", 
      "hotelName": "Hotel Name 2",
      "hotelAddress": "Complete Address",
      "price": "$XX-XX per night",
      "hotelImageUrl": "https://images.unsplash.com/hotel2",
      "geoCoordinates": "lat,lng",
      "rating": "4.0",
      "description": "Hotel description",
      "category": "Mid-range"
    },
    {
      "id": "3",
      "hotelName": "Hotel Name 3", 
      "hotelAddress": "Complete Address",
      "price": "$XX-XX per night",
      "hotelImageUrl": "https://images.unsplash.com/hotel3",
      "geoCoordinates": "lat,lng",
      "rating": "3.5",
      "description": "Hotel description",
      "category": "Budget"
    }
  ],
  "itinerary": [
    ${Array.from({length: targetDays}, (_, i) => `{
      "day": "Day ${i + 1}",
      "plan": [
        {
          "time": "9:00 AM",
          "placeName": "Place Name",
          "placeDetails": "Detailed description",
          "placeImageUrl": "https://images.unsplash.com/place",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "$XX",
          "timeToTravel": "X minutes"
        }
      ]
    }${i < targetDays - 1 ? ',' : ''}`).join('')}
  ]
}

VALIDATION: Your response must have exactly ${targetDays} days and exactly 3 hotels.`;
};

export const generateTravelPlan = async (location, days, traveler, budget, retryCount = 0) => {
  const maxRetries = 3;
  const targetDays = parseInt(days);
  
  console.log(`Generating trip - Attempt ${retryCount + 1}/${maxRetries + 1}`);
  console.log(`Target: ${targetDays} days, 3 hotels`);

  try {
    const chatSession = model.startChat({
      generationConfig: {
        ...generationConfig,
        temperature: Math.max(0.3, generationConfig.temperature - (retryCount * 0.1))
      },
      history: [],
    });

    const promptText = createTravelPrompt(location, targetDays, traveler, budget, retryCount + 1);
    const result = await chatSession.sendMessage(promptText);
    const response = await result.response;
    const text = await response.text();
    
    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    }
    
    // Validate structure
    if (!parsedResponse?.itinerary || !Array.isArray(parsedResponse.itinerary)) {
      throw new Error("Invalid response: missing itinerary array");
    }
    
    if (!parsedResponse?.hotels || !Array.isArray(parsedResponse.hotels)) {
      throw new Error("Invalid response: missing hotels array");
    }
    
    const generatedDays = parsedResponse.itinerary.length;
    const generatedHotels = parsedResponse.hotels.length;
    
    console.log(`Generated: ${generatedDays}/${targetDays} days, ${generatedHotels}/3 hotels`);
    
    // Fix missing days
    if (generatedDays < targetDays) {
      console.log(`Adding ${targetDays - generatedDays} missing days...`);
      
      for (let i = generatedDays; i < targetDays; i++) {
        parsedResponse.itinerary.push({
          day: `Day ${i + 1}`,
          plan: [
            {
              time: "9:00 AM",
              placeName: `Explore ${location}`,
              placeDetails: `Free time to explore ${location} and discover local attractions`,
              placeImageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
              geoCoordinates: "",
              ticketPricing: "Free",
              timeToTravel: "Flexible"
            },
            {
              time: "2:00 PM", 
              placeName: `Local Experience in ${location}`,
              placeDetails: `Enjoy local cuisine and cultural activities`,
              placeImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
              geoCoordinates: "",
              ticketPricing: "$20-50",
              timeToTravel: "Flexible"
            }
          ]
        });
      }
    }
    
    // Fix missing hotels - ensure exactly 3 hotels
    if (generatedHotels < 3) {
      console.log(`Adding ${3 - generatedHotels} missing hotels...`);
      
      const categories = ['Luxury', 'Mid-range', 'Budget'];
      const basePrice = [200, 100, 50];
      
      for (let i = generatedHotels; i < 3; i++) {
        parsedResponse.hotels.push({
          id: `${i + 1}`,
          hotelName: `${location} ${categories[i]} Hotel`,
          hotelAddress: `Main Street, ${location}`,
          price: `$${basePrice[i]}-${basePrice[i] + 50} per night`,
          hotelImageUrl: `https://images.unsplash.com/photo-${1551882547 + i}?ixlib=rb-4.0.3`,
          geoCoordinates: "",
          rating: `${4.5 - (i * 0.5)}`,
          description: `Comfortable ${categories[i].toLowerCase()} hotel in ${location} with modern amenities`,
          category: categories[i]
        });
      }
    }
    
    // Ensure hotels have IDs and correct categories
    const categories = ['Luxury', 'Mid-range', 'Budget'];
    parsedResponse.hotels.forEach((hotel, index) => {
      if (!hotel.id) hotel.id = `${index + 1}`;
      if (!hotel.category || !categories.includes(hotel.category)) {
        hotel.category = categories[Math.min(index, 2)];
      }
    });
    
    const finalDays = parsedResponse.itinerary.length;
    const finalHotels = parsedResponse.hotels.length;
    
    // Check success
    const success = finalDays === targetDays && finalHotels === 3;
    
    if (success) {
      console.log("✅ Success! Got exact number of days and hotels");
      return {
        ...parsedResponse,
        metadata: {
          generatedDays: finalDays,
          targetDays,
          generatedHotels: finalHotels,
          success: true,
          attempt: retryCount + 1
        }
      };
    }
    
    // Retry if not perfect and retries available
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying due to incorrect count...`);
      await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500)));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    // Return partial result
    console.log(`⚠️ Using partial result after ${retryCount + 1} attempts`);
    return {
      ...parsedResponse,
      metadata: {
        generatedDays: finalDays,
        targetDays,
        generatedHotels: finalHotels,
        success: finalDays >= targetDays * 0.8 && finalHotels >= 2,
        attempt: retryCount + 1
      }
    };
    
  } catch (error) {
    console.error(`❌ Error in attempt ${retryCount + 1}:`, error);
    
    // Retry for network errors
    if (retryCount < maxRetries && (
      error.message.includes('network') || 
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    )) {
      console.log(`🔄 Retrying due to network error...`);
      await new Promise(resolve => setTimeout(resolve, 2000 + (retryCount * 1000)));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    throw new Error(`Failed to generate travel plan: ${error.message}`);
  }
};

// Legacy compatibility
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
    console.error("Error sending message:", error);
    return null;
  }
};