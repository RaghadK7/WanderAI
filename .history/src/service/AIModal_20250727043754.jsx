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
  
  return `Generate a travel plan for ${location} specifically tailored for ${budget.toUpperCase()} travelers.

CRITICAL REQUIREMENTS:
- Duration: EXACTLY ${targetDays} days
- Budget Category: ${budget.toUpperCase()}
- Traveler: ${traveler}
- Hotels: EXACTLY 3 hotels ALL in ${budget.toUpperCase()} category
- Each day must have 6-8 places/activities (breakfast, 2-3 attractions, lunch, 2-3 more places, dinner)
- ${budgetConfig.recommendations}

BUDGET-SPECIFIC GUIDELINES:
${budget.toLowerCase() === 'cheap' ? `
- Prioritize FREE attractions and activities
- Include budget restaurants, street food, local markets
- Suggest public transportation
- Focus on hostels, guesthouses, budget hotels
- Mention free walking tours, public parks, free museums
- Include local neighborhoods to explore for free
` : budget.toLowerCase() === 'luxury' ? `
- Include premium experiences and fine dining
- Suggest luxury hotels with spa/amenities
- Include private tours and exclusive experiences
- Recommend upscale restaurants and rooftop bars
- Consider private transportation options
- Include high-end shopping areas and exclusive attractions
` : `
- Balance between quality and value
- Mix of popular paid attractions and some free activities
- Comfortable mid-range accommodations
- Good local restaurants with reasonable prices
- Mix of public transport and occasional taxi/ride-share
- Include both tourist spots and local experiences
`}

REQUIRED JSON STRUCTURE:
{
  "hotels": [
    {
      "id": "1",
      "hotelName": "Hotel Name 1",
      "hotelAddress": "Complete Address in ${location}",
      "price": "${budgetConfig.priceRanges.hotels[0]} per night",
      "hotelImageUrl": "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
      "geoCoordinates": "lat,lng",
      "rating": "4.0",
      "description": "${budgetConfig.hotelCategories[0]} hotel in ${location} with good amenities",
      "category": "${budgetConfig.hotelCategories[0]}"
    },
    {
      "id": "2", 
      "hotelName": "Hotel Name 2",
      "hotelAddress": "Complete Address in ${location}",
      "price": "${budgetConfig.priceRanges.hotels[1]} per night",
      "hotelImageUrl": "https://images.unsplash.com/photo-1551882547-3618739a3d82",
      "geoCoordinates": "lat,lng",
      "rating": "3.8",
      "description": "${budgetConfig.hotelCategories[1]} hotel in ${location} with modern facilities",
      "category": "${budgetConfig.hotelCategories[1]}"
    },
    {
      "id": "3",
      "hotelName": "Hotel Name 3", 
      "hotelAddress": "Complete Address in ${location}",
      "price": "${budgetConfig.priceRanges.hotels[2]} per night",
      "hotelImageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
      "geoCoordinates": "lat,lng",
      "rating": "3.5",
      "description": "${budgetConfig.hotelCategories[2]} hotel in ${location} with essential amenities",
      "category": "${budgetConfig.hotelCategories[2]}"
    }
  ],
  "itinerary": [
    ${Array.from({length: targetDays}, (_, i) => `{
      "day": "Day ${i + 1}",
      "plan": [
        {
          "time": "8:00 AM",
          "placeName": "${budget.toLowerCase() === 'cheap' ? 'Local Breakfast Spot' : budget.toLowerCase() === 'luxury' ? 'Premium Restaurant' : 'Popular Breakfast Place'}",
          "placeDetails": "Start your day with breakfast suitable for ${budget} travelers in ${location}",
          "placeImageUrl": "https://images.unsplash.com/photo-1551218808-94e220e084d2",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.food[0]}",
          "timeToTravel": "15 minutes"
        },
        {
          "time": "9:30 AM",
          "placeName": "Morning Attraction 1",
          "placeDetails": "First major attraction/activity suitable for ${budget} budget in ${location}",
          "placeImageUrl": "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.activities[0]}",
          "timeToTravel": "20 minutes"
        },
        {
          "time": "11:30 AM",
          "placeName": "Morning Attraction 2",
          "placeDetails": "Second morning activity/place to visit in ${location}",
          "placeImageUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.activities[1]}",
          "timeToTravel": "15 minutes"
        },
        {
          "time": "1:00 PM",
          "placeName": "${budget.toLowerCase() === 'cheap' ? 'Local Food Market' : budget.toLowerCase() === 'luxury' ? 'Fine Dining Restaurant' : 'Good Local Restaurant'}",
          "placeDetails": "Lunch recommendation matching ${budget} preferences in ${location}",
          "placeImageUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.food[1]}",
          "timeToTravel": "10 minutes"
        },
        {
          "time": "2:30 PM",
          "placeName": "Afternoon Attraction 1",
          "placeDetails": "First afternoon activity suitable for ${budget} travelers",
          "placeImageUrl": "https://images.unsplash.com/photo-1564399580075-5dfe19c205f3",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.activities[1]}",
          "timeToTravel": "25 minutes"
        },
        {
          "time": "4:30 PM",
          "placeName": "Afternoon Attraction 2",
          "placeDetails": "Second afternoon place to visit in ${location}",
          "placeImageUrl": "https://images.unsplash.com/photo-1555109307-f7d9da25c244",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.activities[2]}",
          "timeToTravel": "20 minutes"
        },
        {
          "time": "6:00 PM",
          "placeName": "Evening Activity",
          "placeDetails": "Evening relaxation or cultural activity in ${location}",
          "placeImageUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budget.toLowerCase() === 'cheap' ? 'Free' : budgetConfig.priceRanges.activities[0]}",
          "timeToTravel": "15 minutes"
        },
        {
          "time": "7:30 PM",
          "placeName": "${budget.toLowerCase() === 'cheap' ? 'Street Food Area' : budget.toLowerCase() === 'luxury' ? 'Upscale Restaurant' : 'Popular Dinner Spot'}",
          "placeDetails": "Dinner recommendation for ${budget} budget in ${location}",
          "placeImageUrl": "https://images.unsplash.com/photo-1559339352-11d035aa65de",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.food[2]}",
          "timeToTravel": "20 minutes"
        }
      ]
    }${i < targetDays - 1 ? ',' : ''}`).join('')}
  ]
}

VALIDATION: 
- All hotels must be ${budget.toUpperCase()} category
- All prices must match ${budget} budget range
- Activities must be appropriate for ${budget} travelers
- Must have exactly ${targetDays} days and exactly 3 hotels
- Each day must have 8 activities/places`;
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
              timeToTravel: "Flexible"
            },
            {
              time: "12:00 PM",
              placeName: budget.toLowerCase() === 'cheap' ? 'Local Eatery' : budget.toLowerCase() === 'luxury' ? 'Fine Restaurant' : 'Popular Restaurant',
              placeDetails: `Lunch suitable for ${budget} budget`,
              placeImageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
              geoCoordinates: "",
              ticketPricing: budgetConfig.priceRanges.food[1],
              timeToTravel: "15 minutes"
            },
            {
              time: "2:00 PM", 
              placeName: `Afternoon Activity in ${location}`,
              placeDetails: `Afternoon exploration suitable for ${budget} travelers`,
              placeImageUrl: "https://images.unsplash.com/photo-1564399580075-5dfe19c205f3",
              geoCoordinates: "",
              ticketPricing: budgetConfig.priceRanges.activities[1],
              timeToTravel: "20 minutes"
            },
            {
              time: "6:00 PM",
              placeName: budget.toLowerCase() === 'cheap' ? 'Street Food' : budget.toLowerCase() === 'luxury' ? 'Upscale Dining' : 'Dinner Spot',
              placeDetails: `Evening meal for ${budget} budget`,
              placeImageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de",
              geoCoordinates: "",
              ticketPricing: budgetConfig.priceRanges.food[2],
              timeToTravel: "25 minutes"
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