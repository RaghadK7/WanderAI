import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.6,
  topP: 0.9,
  topK: 32,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const getBudgetConfig = (budget) => {
  const configs = {
    'cheap': {
      categories: ['Budget', 'Economy', 'Hostel'],
      prices: ['$20-40', '$30-50', '$40-60'],
      food: ['$5-15', '$10-20', '$15-25'],
      activities: ['Free', '$5-15', '$10-20']
    },
    'moderate': {
      categories: ['Mid-range', 'Comfort', 'Standard'],
      prices: ['$60-100', '$80-120', '$100-140'],
      food: ['$15-30', '$20-40', '$25-50'],
      activities: ['$10-25', '$15-35', '$20-40']
    },
    'luxury': {
      categories: ['Luxury', 'Premium', 'Five-Star'],
      prices: ['$200-350', '$300-500', '$400-600'],
      food: ['$50-100', '$75-150', '$100-200'],
      activities: ['$30-75', '$50-100', '$75-150']
    }
  };
  return configs[budget.toLowerCase()] || configs['moderate'];
};

const createTravelPrompt = (location, days, traveler, budget) => {
  const targetDays = parseInt(days);
  const config = getBudgetConfig(budget);
  
  return `Generate a ${targetDays}-day travel plan for ${location}.

REQUIREMENTS:
- EXACTLY ${targetDays} days (Day 1 to Day ${targetDays})
- Budget: ${budget.toUpperCase()}
- Traveler: ${traveler}
- 3 REAL hotels matching ${budget} budget
- 5-6 REAL places per day with actual names
- All places must exist and be searchable on Google Maps

BUDGET SETTINGS:
${budget.toLowerCase() === 'cheap' ? 'Budget travelers: hostels, street food, free attractions, public transport' :
  budget.toLowerCase() === 'luxury' ? 'Luxury travelers: 5-star hotels, fine dining, premium experiences, private transport' :
  'Mid-range travelers: 3-4 star hotels, good restaurants, popular attractions, mixed transport'}

JSON FORMAT:
{
  "hotels": [
    {"id": "1", "hotelName": "Real hotel name", "hotelAddress": "Real address", "price": "${config.prices[0]} per night", "hotelImageUrl": "https://images.unsplash.com/photo-1564501049412", "geoCoordinates": "lat,lng", "rating": "4.0", "description": "Hotel description", "category": "${config.categories[0]}"},
    {"id": "2", "hotelName": "Real hotel name", "hotelAddress": "Real address", "price": "${config.prices[1]} per night", "hotelImageUrl": "https://images.unsplash.com/photo-1551882547", "geoCoordinates": "lat,lng", "rating": "3.8", "description": "Hotel description", "category": "${config.categories[1]}"},
    {"id": "3", "hotelName": "Real hotel name", "hotelAddress": "Real address", "price": "${config.prices[2]} per night", "hotelImageUrl": "https://images.unsplash.com/photo-1571896349", "geoCoordinates": "lat,lng", "rating": "3.5", "description": "Hotel description", "category": "${config.categories[2]}"}
  ],
  "itinerary": [
    ${Array.from({length: targetDays}, (_, i) => `
    {"day": "Day ${i + 1}", "plan": [
      {"time": "9:00 AM", "placeName": "Real breakfast place", "placeDetails": "Actual restaurant in ${location}", "placeImageUrl": "https://images.unsplash.com/photo-1551218808", "geoCoordinates": "lat,lng", "ticketPricing": "${config.food[0]}", "timeToTravel": "${i === 0 ? 'Start of day' : '10-15 minutes from hotel'}"},
      {"time": "10:30 AM", "placeName": "Real attraction name", "placeDetails": "Actual tourist site", "placeImageUrl": "https://images.unsplash.com/photo-1488646953", "geoCoordinates": "lat,lng", "ticketPricing": "${config.activities[0]}", "timeToTravel": "15-20 minutes from breakfast"},
      {"time": "1:00 PM", "placeName": "Real restaurant name", "placeDetails": "Actual lunch place", "placeImageUrl": "https://images.unsplash.com/photo-1540189549", "geoCoordinates": "lat,lng", "ticketPricing": "${config.food[1]}", "timeToTravel": "10-15 minutes from attraction"},
      {"time": "3:00 PM", "placeName": "Real place name", "placeDetails": "Actual afternoon activity", "placeImageUrl": "https://images.unsplash.com/photo-1564399580", "geoCoordinates": "lat,lng", "ticketPricing": "${config.activities[1]}", "timeToTravel": "20-25 minutes from lunch"},
      {"time": "6:00 PM", "placeName": "Real evening spot", "placeDetails": "Actual evening location", "placeImageUrl": "https://images.unsplash.com/photo-1507525428", "geoCoordinates": "lat,lng", "ticketPricing": "${config.activities[2]}", "timeToTravel": "15-20 minutes from afternoon"},
      {"time": "8:00 PM", "placeName": "Real dinner restaurant", "placeDetails": "Actual dinner place", "placeImageUrl": "https://images.unsplash.com/photo-1559339352", "geoCoordinates": "lat,lng", "ticketPricing": "${config.food[2]}", "timeToTravel": "10-15 minutes from evening spot"}
    ]}${i < targetDays - 1 ? ',' : ''}`).join('')}
  ]
}

CRITICAL: Must have exactly ${targetDays} days with real place names in ${location}.`;
};

export const generateTravelPlan = async (location, days, traveler, budget, retryCount = 0) => {
  const maxRetries = 2;
  const targetDays = parseInt(days);
  
  console.log(`Generating ${targetDays} days for ${location}, Budget: ${budget}, Attempt: ${retryCount + 1}`);

  try {
    const chatSession = model.startChat({
      generationConfig: {
        ...generationConfig,
        temperature: Math.max(0.4, generationConfig.temperature - (retryCount * 0.2))
      },
      history: [],
    });

    const result = await chatSession.sendMessage(createTravelPrompt(location, targetDays, traveler, budget));
    const text = await result.response.text();
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (!parsedResponse) throw new Error("No valid JSON found");
    }
    
    if (!parsedResponse?.itinerary || !Array.isArray(parsedResponse.itinerary)) {
      throw new Error("Invalid itinerary structure");
    }
    
    const generatedDays = parsedResponse.itinerary.length;
    console.log(`Generated: ${generatedDays}/${targetDays} days`);
    
    // Force exact number of days
    if (generatedDays !== targetDays) {
      console.log(`Fixing day count: ${generatedDays} -> ${targetDays}`);
      
      if (generatedDays < targetDays) {
        // Add missing days
        const config = getBudgetConfig(budget);
        for (let i = generatedDays; i < targetDays; i++) {
          parsedResponse.itinerary.push({
            day: `Day ${i + 1}`,
            plan: [
              {time: "9:00 AM", placeName: `Explore ${location}`, placeDetails: `Morning exploration`, placeImageUrl: "https://images.unsplash.com/photo-1488646953014", geoCoordinates: "", ticketPricing: config.activities[0], timeToTravel: "Start of day"},
              {time: "1:00 PM", placeName: `Local Restaurant`, placeDetails: `Lunch in ${location}`, placeImageUrl: "https://images.unsplash.com/photo-1540189549336", geoCoordinates: "", ticketPricing: config.food[1], timeToTravel: "15 minutes"},
              {time: "3:00 PM", placeName: `Afternoon Activity`, placeDetails: `Afternoon in ${location}`, placeImageUrl: "https://images.unsplash.com/photo-1564399580075", geoCoordinates: "", ticketPricing: config.activities[1], timeToTravel: "20 minutes"},
              {time: "8:00 PM", placeName: `Dinner`, placeDetails: `Evening meal`, placeImageUrl: "https://images.unsplash.com/photo-1559339352", geoCoordinates: "", ticketPricing: config.food[2], timeToTravel: "25 minutes"}
            ]
          });
        }
      } else {
        // Remove extra days
        parsedResponse.itinerary = parsedResponse.itinerary.slice(0, targetDays);
      }
    }
    
    // Fix hotels if needed
    if (!parsedResponse.hotels || parsedResponse.hotels.length < 3) {
      const config = getBudgetConfig(budget);
      parsedResponse.hotels = [
        {id: "1", hotelName: `${location} ${config.categories[0]} Hotel`, hotelAddress: `Main Street, ${location}`, price: `${config.prices[0]} per night`, hotelImageUrl: "https://images.unsplash.com/photo-1564501049412", geoCoordinates: "", rating: "4.0", description: `${config.categories[0]} hotel`, category: config.categories[0]},
        {id: "2", hotelName: `${location} ${config.categories[1]} Hotel`, hotelAddress: `Central Area, ${location}`, price: `${config.prices[1]} per night`, hotelImageUrl: "https://images.unsplash.com/photo-1551882547", geoCoordinates: "", rating: "3.8", description: `${config.categories[1]} hotel`, category: config.categories[1]},
        {id: "3", hotelName: `${location} ${config.categories[2]} Hotel`, hotelAddress: `Downtown, ${location}`, price: `${config.prices[2]} per night`, hotelImageUrl: "https://images.unsplash.com/photo-1571896349", geoCoordinates: "", rating: "3.5", description: `${config.categories[2]} hotel`, category: config.categories[2]}
      ];
    }
    
    const finalDays = parsedResponse.itinerary.length;
    console.log(`✅ Final result: ${finalDays} days, ${parsedResponse.hotels.length} hotels`);
    
    return {
      ...parsedResponse,
      metadata: { generatedDays: finalDays, targetDays, success: finalDays === targetDays, attempt: retryCount + 1 }
    };
    
  } catch (error) {
    console.error(`❌ Attempt ${retryCount + 1} failed:`, error.message);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    throw new Error(`Failed to generate plan: ${error.message}`);
  }
};

// Legacy functions
export const chatSession = {
  sendMessage: async (promptText) => {
    const tempSession = model.startChat({ generationConfig, history: [] });
    const result = await tempSession.sendMessage(promptText);
    return await result.response.text();
  }
};

export const sendMessage = async (promptText) => {
  try {
    return await chatSession.sendMessage(promptText);
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};