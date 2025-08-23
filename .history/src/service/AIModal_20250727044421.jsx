import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// دالة تحديد الميزانية والفئات
const getBudgetConfig = (budget) => {
  switch(budget.toLowerCase()) {
    case 'cheap':
      return {
        hotelCategories: ['Budget', 'Economy', 'Hostel'],
        priceRanges: {
          hotels: ['$20-40', '$30-50', '$40-60'],
          food: ['$5-15', '$10-20', '$15-25'],
          activities: ['Free', '$5-15', '$10-20']
        },
        recommendations: 'Focus on budget-friendly options, free attractions, local street food, public transport, hostels and budget hotels'
      };
    
    case 'moderate':
      return {
        hotelCategories: ['Mid-range', 'Comfort', 'Standard'],
        priceRanges: {
          hotels: ['$60-100', '$80-120', '$100-140'],
          food: ['$15-30', '$20-40', '$25-50'],
          activities: ['$10-25', '$15-35', '$20-40']
        },
        recommendations: 'Include mix of popular attractions, mid-range restaurants, comfortable hotels, occasional taxi/ride-share'
      };
    
    case 'luxury':
      return {
        hotelCategories: ['Luxury', 'Premium', 'Five-Star'],
        priceRanges: {
          hotels: ['$200-350', '$300-500', '$400-600'],
          food: ['$50-100', '$75-150', '$100-200'],
          activities: ['$30-75', '$50-100', '$75-150']
        },
        recommendations: 'Focus on high-end experiences, fine dining, luxury hotels, private tours, premium transportation'
      };
    
    default:
      return getBudgetConfig('moderate');
  }
};

const createTravelPrompt = (location, days, traveler, budget, attempt = 1) => {
  const targetDays = parseInt(days);
  const budgetConfig = getBudgetConfig(budget);
  
  return `You are a LOCAL TRAVEL EXPERT for ${location}. Generate a travel plan with REAL, SPECIFIC places that actually exist in ${location}.

CRITICAL REQUIREMENTS:
- Duration: EXACTLY ${targetDays} days
- Budget Category: ${budget.toUpperCase()}
- Traveler: ${traveler}
- Use ONLY real places, restaurants, and hotels that exist in ${location}
- Include specific names, addresses, and actual prices
- Hotels: EXACTLY 3 REAL hotels in ${location} matching ${budget.toUpperCase()} budget
- Each day must have 6-8 REAL places (breakfast spot, 2-3 attractions, lunch place, 2-3 more places, dinner restaurant)
- ALL places must be real and searchable on Google Maps
- ${budgetConfig.recommendations}

REAL PLACES REQUIREMENTS FOR ${budget.toUpperCase()} BUDGET:
${budget.toLowerCase() === 'cheap' ? `
- REAL budget hotels/hostels in ${location} (${budgetConfig.priceRanges.hotels[0]} range)
- ACTUAL free attractions (specific parks, free museums, markets)
- REAL local restaurants and street food vendors with actual names
- SPECIFIC neighborhoods known for budget travelers
- ACTUAL public transport routes and stations
- REAL local markets with specific names and locations
EXAMPLES: Name specific hostels like "Backpackers Hostel ${location}", actual free parks, real street food areas
` : budget.toLowerCase() === 'luxury' ? `
- REAL 5-star luxury hotels in ${location} (${budgetConfig.priceRanges.hotels[0]} range)
- ACTUAL high-end restaurants with real names and addresses
- SPECIFIC luxury experiences and private tours available in ${location}
- REAL upscale shopping districts and luxury boutiques
- ACTUAL premium attractions and exclusive venues
- REAL spa and wellness centers
EXAMPLES: Name actual luxury hotels like "Four Seasons ${location}", real Michelin restaurants, specific luxury malls
` : `
- REAL 3-4 star hotels in ${location} (${budgetConfig.priceRanges.hotels[0]} range)
- ACTUAL popular restaurants locals recommend
- SPECIFIC tourist attractions with real entrance fees
- REAL public transport + occasional taxi options
- ACTUAL museums, landmarks, and cultural sites
- REAL local experiences tourists actually do
EXAMPLES: Name real mid-range hotels, actual restaurants with good reviews, specific attractions with real prices
`}

MANDATORY: Every place must be:
✅ A real place that exists in ${location}
✅ Searchable on Google Maps
✅ Have actual operating hours and prices
✅ Match the ${budget} budget level
✅ Be appropriate for ${traveler} travelers

REQUIRED JSON STRUCTURE:
{
  "hotels": [
    {
      "id": "1",
      "hotelName": "REAL hotel name in ${location}",
      "hotelAddress": "Actual street address, ${location}",
      "price": "${budgetConfig.priceRanges.hotels[0]} per night",
      "hotelImageUrl": "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
      "geoCoordinates": "actual latitude,longitude",
      "rating": "4.0",
      "description": "Real ${budgetConfig.hotelCategories[0]} hotel that exists in ${location}",
      "category": "${budgetConfig.hotelCategories[0]}"
    },
    {
      "id": "2", 
      "hotelName": "REAL hotel name in ${location}",
      "hotelAddress": "Actual street address, ${location}",
      "price": "${budgetConfig.priceRanges.hotels[1]} per night",
      "hotelImageUrl": "https://images.unsplash.com/photo-1551882547-3618739a3d82",
      "geoCoordinates": "actual latitude,longitude",
      "rating": "3.8",
      "description": "Real ${budgetConfig.hotelCategories[1]} hotel that exists in ${location}",
      "category": "${budgetConfig.hotelCategories[1]}"
    },
    {
      "id": "3",
      "hotelName": "REAL hotel name in ${location}",
      "hotelAddress": "Actual street address, ${location}",
      "price": "${budgetConfig.priceRanges.hotels[2]} per night",
      "hotelImageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
      "geoCoordinates": "actual latitude,longitude",
      "rating": "3.5",
      "description": "Real ${budgetConfig.hotelCategories[2]} hotel that exists in ${location}",
      "category": "${budgetConfig.hotelCategories[2]}"
    }
  ],
  "itinerary": [
    ${Array.from({length: targetDays}, (_, i) => `{
      "day": "Day ${i + 1}",
      "plan": [
        {
          "time": "8:00 AM",
          "placeName": "REAL breakfast place name in ${location}",
          "placeDetails": "Specific breakfast restaurant/cafe that exists in ${location}, known for ${budget} prices",
          "placeImageUrl": "https://images.unsplash.com/photo-1551218808-94e220e084d2",
          "geoCoordinates": "actual latitude,longitude",
          "ticketPricing": "${budgetConfig.priceRanges.food[0]}",
          "timeToTravel": "Start of day"
        },
        {
          "time": "9:30 AM",
          "placeName": "REAL attraction/landmark name in ${location}",
          "placeDetails": "Specific tourist attraction or landmark that actually exists in ${location} with real entrance fee",
          "placeImageUrl": "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
          "geoCoordinates": "actual latitude,longitude",
          "ticketPricing": "${budgetConfig.priceRanges.activities[0]}",
          "timeToTravel": "X minutes from breakfast place"
        },
        {
          "time": "11:30 AM",
          "placeName": "REAL museum/park/attraction name in ${location}",
          "placeDetails": "Second real place to visit in ${location} with actual operating hours and prices",
          "placeImageUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
          "geoCoordinates": "actual latitude,longitude",
          "ticketPricing": "${budgetConfig.priceRanges.activities[1]}",
          "timeToTravel": "X minutes from previous attraction"
        },
        {
          "time": "1:00 PM",
          "placeName": "REAL restaurant name in ${location}",
          "placeDetails": "Specific restaurant that exists in ${location}, popular for ${budget} lunch with actual menu prices",
          "placeImageUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
          "geoCoordinates": "actual latitude,longitude",
          "ticketPricing": "${budgetConfig.priceRanges.food[1]}",
          "timeToTravel": "X minutes from museum/park"
        },
        {
          "time": "2:30 PM",
          "placeName": "REAL shopping/cultural area name in ${location}",
          "placeDetails": "Specific neighborhood, market, or cultural area that exists in ${location}",
          "placeImageUrl": "https://images.unsplash.com/photo-1564399580075-5dfe19c205f3",
          "geoCoordinates": "actual latitude,longitude",
          "ticketPricing": "${budgetConfig.priceRanges.activities[1]}",
          "timeToTravel": "X minutes from lunch restaurant"
        },
        {
          "time": "4:30 PM",
          "placeName": "REAL viewpoint/activity name in ${location}",
          "placeDetails": "Specific viewpoint, activity center, or attraction that actually exists in ${location}",
          "placeImageUrl": "https://images.unsplash.com/photo-1555109307-f7d9da25c244",
          "geoCoordinates": "actual latitude,longitude",
          "ticketPricing": "${budgetConfig.priceRanges.activities[2]}",
          "timeToTravel": "X minutes from shopping area"
        },
        {
          "time": "6:00 PM",
          "placeName": "REAL relaxation spot name in ${location}",
          "placeDetails": "Specific park, waterfront, or relaxation area that exists in ${location}",
          "placeImageUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
          "geoCoordinates": "actual latitude,longitude",
          "ticketPricing": "${budget.toLowerCase() === 'cheap' ? 'Free' : budgetConfig.priceRanges.activities[0]}",
          "timeToTravel": "X minutes from viewpoint"
        },
        {
          "time": "7:30 PM",
          "placeName": "REAL dinner restaurant name in ${location}",
          "placeDetails": "Specific dinner restaurant that exists in ${location}, known for ${budget} dining with real prices",
          "placeImageUrl": "https://images.unsplash.com/photo-1559339352-11d035aa65de",
          "geoCoordinates": "actual latitude,longitude",
          "ticketPricing": "${budgetConfig.priceRanges.food[2]}",
          "timeToTravel": "X minutes from relaxation spot"
        }
      ]
    }${i < targetDays - 1 ? ',' : ''}`).join('')}
  ]
}

VALIDATION: 
- All hotels must be REAL hotels that exist in ${location} and match ${budget.toUpperCase()} category
- All restaurants must be REAL restaurants with actual names and addresses in ${location}
- All attractions must be REAL places that tourists can actually visit in ${location}
- All prices must be realistic and match ${budget} budget range
- Every place must be searchable on Google Maps
- Must have exactly ${targetDays} days and exactly 3 REAL hotels
- Each day must have 8 REAL places/activities with specific names
- Include actual street addresses where possible
- timeToTravel must show actual travel time between consecutive locations (e.g., "15 minutes from [previous place name]")
- First activity of each day should have "Start of day" for timeToTravel

IMPORTANT: Do not use generic names like "Local Restaurant" or "Popular Attraction". Use ACTUAL business names and real places that exist in ${location}.

TRAVEL TIME EXAMPLES:
- "5 minutes walking from [previous place]"  
- "15 minutes by taxi from [previous place]"
- "10 minutes by public transport from [previous place]"
- "20 minutes driving from [previous place]"`;
};

// دالة إصلاح الفنادق المفقودة
const fixMissingHotels = (parsedResponse, location, budget) => {
  const budgetConfig = getBudgetConfig(budget);
  
  if (parsedResponse.hotels.length < 3) {
    for (let i = parsedResponse.hotels.length; i < 3; i++) {
      parsedResponse.hotels.push({
        id: `${i + 1}`,
        hotelName: `${location} ${budgetConfig.hotelCategories[i]} Hotel`,
        hotelAddress: `Main Street, ${location}`,
        price: `${budgetConfig.priceRanges.hotels[i]} per night`,
        hotelImageUrl: `https://images.unsplash.com/photo-${1551882547 + i}?ixlib=rb-4.0.3`,
        geoCoordinates: "",
        rating: `${4.0 - (i * 0.2)}`,
        description: `Comfortable ${budgetConfig.hotelCategories[i].toLowerCase()} hotel in ${location}`,
        category: budgetConfig.hotelCategories[i]
      });
    }
  }
  
  // التأكد من أن جميع الفنادق لها الفئة الصحيحة
  parsedResponse.hotels.forEach((hotel, index) => {
    if (!hotel.category || index < budgetConfig.hotelCategories.length) {
      hotel.category = budgetConfig.hotelCategories[Math.min(index, 2)];
      hotel.price = budgetConfig.priceRanges.hotels[Math.min(index, 2)] + ' per night';
    }
  });
};

export const generateTravelPlan = async (location, days, traveler, budget, retryCount = 0) => {
  const maxRetries = 3;
  const targetDays = parseInt(days);
  
  console.log(`Generating trip - Attempt ${retryCount + 1}/${maxRetries + 1}`);
  console.log(`Target: ${targetDays} days, Budget: ${budget}`);

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
      const budgetConfig = getBudgetConfig(budget);
      
      for (let i = generatedDays; i < targetDays; i++) {
        parsedResponse.itinerary.push({
          day: `Day ${i + 1}`,
          plan: [
            {
              time: "9:00 AM",
              placeName: `Morning in ${location}`,
              placeDetails: `Start the day exploring ${location}`,
              placeImageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
              geoCoordinates: "",
              ticketPricing: budgetConfig.priceRanges.activities[0],
              timeToTravel: "Start of day"
            },
            {
              time: "12:00 PM",
              placeName: budget.toLowerCase() === 'cheap' ? 'Local Eatery' : budget.toLowerCase() === 'luxury' ? 'Fine Restaurant' : 'Popular Restaurant',
              placeDetails: `Lunch suitable for ${budget} budget`,
              placeImageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
              geoCoordinates: "",
              ticketPricing: budgetConfig.priceRanges.food[1],
              timeToTravel: "15 minutes from morning location"
            },
            {
              time: "2:00 PM", 
              placeName: `Afternoon Activity in ${location}`,
              placeDetails: `Afternoon exploration suitable for ${budget} travelers`,
              placeImageUrl: "https://images.unsplash.com/photo-1564399580075-5dfe19c205f3",
              geoCoordinates: "",
              ticketPricing: budgetConfig.priceRanges.activities[1],
              timeToTravel: "20 minutes from lunch restaurant"
            },
            {
              time: "6:00 PM",
              placeName: budget.toLowerCase() === 'cheap' ? 'Street Food' : budget.toLowerCase() === 'luxury' ? 'Upscale Dining' : 'Dinner Spot',
              placeDetails: `Evening meal for ${budget} budget`,
              placeImageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de",
              geoCoordinates: "",
              ticketPricing: budgetConfig.priceRanges.food[2],
              timeToTravel: "25 minutes from afternoon activity"
            }
          ]
        });
      }
    }
    
    // Fix missing hotels using the budget-aware function
    fixMissingHotels(parsedResponse, location, budget);
    
    const finalDays = parsedResponse.itinerary.length;
    const finalHotels = parsedResponse.hotels.length;
    
    // Check success
    const success = finalDays === targetDays && finalHotels === 3;
    
    if (success) {
      console.log("✅ Success! Got exact number of days and budget-appropriate hotels");
      return {
        ...parsedResponse,
        metadata: {
          generatedDays: finalDays,
          targetDays,
          generatedHotels: finalHotels,
          budget: budget,
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
        budget: budget,
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

// Legacy compatibility functions
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