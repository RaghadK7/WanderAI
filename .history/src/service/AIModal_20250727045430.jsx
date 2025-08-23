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

// Updated prompt function with budget-specific requirements
const createPrompt = (location, days, traveler, budget) => {
  const budgetRequirements = {
    'Cheap': 'budget hotels ($20-60/night), street food, free attractions, public transport',
    'Moderate': '3-4 star hotels ($60-150/night), mid-range restaurants, popular attractions, mixed transport',
    'Luxury': '5-star hotels ($200-500/night), fine dining, premium experiences, private transport'
  };

  return `Generate Travel Plan for Location: ${location}, for ${days} Days for ${traveler} with a ${budget} budget.

CRITICAL REQUIREMENTS:
- EXACTLY ${days} days (Day 1, Day 2, ... Day ${days})
- Budget: ${budget} - ${budgetRequirements[budget] || budgetRequirements['Moderate']}
- Each day must have 5-6 real places with specific names
- All places must exist and be searchable on Google Maps

Give me Hotels options list with HotelName, Hotel address, Price, hotel image url, geo coordinates, rating, descriptions and suggest itinerary with placeName, Place Details, Place Image Url, Geo Coordinates, ticket Pricing, Time travel from previous location for ${days} days with each day plan with best time to visit in JSON format.

IMPORTANT: Use real place names, not generic ones. For travel time, specify actual minutes from previous location (e.g., "15 minutes from hotel", "20 minutes from restaurant").`;
};

export const generateTravelPlan = async (location, days, traveler, budget, retryCount = 0) => {
  const maxRetries = 3;
  const targetDays = parseInt(days);
  
  console.log(`Attempt ${retryCount + 1}: Generating ${targetDays} days for ${location}, ${budget} budget`);

  try {
    const chatSession = model.startChat({
      generationConfig: {
        ...generationConfig,
        temperature: Math.max(0.5, generationConfig.temperature - (retryCount * 0.1))
      },
      history: [],
    });

    const prompt = createPrompt(location, targetDays, traveler, budget);
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();
    
    console.log(`AI Response length: ${text.length} characters`);
    
    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      console.log("Trying to extract JSON from response...");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
      }
    }
    
    // Validate response structure
    if (!parsedResponse || !parsedResponse.itinerary || !Array.isArray(parsedResponse.itinerary)) {
      throw new Error("Invalid response structure: missing itinerary array");
    }
    
    const generatedDays = parsedResponse.itinerary.length;
    console.log(`Generated ${generatedDays}/${targetDays} days`);
    
    // FORCE exact number of days
    if (generatedDays !== targetDays) {
      console.log(`Fixing day count from ${generatedDays} to ${targetDays}`);
      
      if (generatedDays < targetDays) {
        // Add missing days
        for (let i = generatedDays; i < targetDays; i++) {
          const dayNumber = i + 1;
          parsedResponse.itinerary.push({
            day: `Day ${dayNumber}`,
            plan: [
              {
                time: "9:00 AM - 11:00 AM",
                placeName: `Explore ${location} - Local Area`,
                placeDetails: `Morning exploration of local neighborhoods and hidden gems in ${location}`,
                placeImageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: budget === 'Cheap' ? "Free" : budget === 'Luxury' ? "$50-100" : "$20-50",
                timeToTravel: "Start of day"
              },
              {
                time: "11:00 AM - 1:00 PM",
                placeName: `${location} Cultural Site`,
                placeDetails: `Visit cultural attractions and landmarks specific to ${location}`,
                placeImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: budget === 'Cheap' ? "$10-20" : budget === 'Luxury' ? "$75-150" : "$25-50",
                timeToTravel: "20 minutes from morning location"
              },
              {
                time: "1:00 PM - 3:00 PM",
                placeName: `Local Restaurant in ${location}`,
                placeDetails: `Lunch at popular local restaurant matching ${budget} budget`,
                placeImageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: budget === 'Cheap' ? "$10-20" : budget === 'Luxury' ? "$75-150" : "$25-50",
                timeToTravel: "15 minutes from cultural site"
              },
              {
                time: "3:00 PM - 5:00 PM",
                placeName: `${location} Shopping District`,
                placeDetails: `Afternoon shopping and exploring commercial areas in ${location}`,
                placeImageUrl: "https://images.unsplash.com/photo-1564399580075-5dfe19c205f3",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: "Varies",
                timeToTravel: "25 minutes from restaurant"
              },
              {
                time: "5:00 PM - 7:00 PM",
                placeName: `${location} Scenic Viewpoint`,
                placeDetails: `Evening relaxation at scenic spots with great views of ${location}`,
                placeImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: budget === 'Cheap' ? "Free" : budget === 'Luxury' ? "$30-75" : "$10-25",
                timeToTravel: "30 minutes from shopping area"
              },
              {
                time: "7:00 PM - 9:00 PM",
                placeName: `Dinner in ${location}`,
                placeDetails: `Evening dining experience suitable for ${budget} budget`,
                placeImageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: budget === 'Cheap' ? "$15-30" : budget === 'Luxury' ? "$100-200" : "$40-80",
                timeToTravel: "20 minutes from viewpoint"
              }
            ]
          });
        }
      } else if (generatedDays > targetDays) {
        // Remove extra days
        parsedResponse.itinerary = parsedResponse.itinerary.slice(0, targetDays);
      }
    }
    
    // Ensure we have hotels
    if (!parsedResponse.hotels || parsedResponse.hotels.length === 0) {
      parsedResponse.hotels = [
        {
          hotelName: `${location} ${budget} Hotel 1`,
          hotelAddress: `Main Street, ${location}`,
          price: budget === 'Cheap' ? "$30-60 per night" : budget === 'Luxury' ? "$300-500 per night" : "$80-150 per night",
          hotelImageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
          geoCoordinates: "36.1695, -115.1438",
          rating: budget === 'Luxury' ? "5 stars" : budget === 'Moderate' ? "4 stars" : "3 stars",
          description: `${budget} accommodation in ${location} with good amenities`
        },
        {
          hotelName: `${location} ${budget} Hotel 2`,
          hotelAddress: `Central District, ${location}`,
          price: budget === 'Cheap' ? "$25-50 per night" : budget === 'Luxury' ? "$250-400 per night" : "$70-120 per night",
          hotelImageUrl: "https://images.unsplash.com/photo-1551882547-3618739a3d82",
          geoCoordinates: "36.1695, -115.1438",
          rating: budget === 'Luxury' ? "5 stars" : budget === 'Moderate' ? "3.5 stars" : "3 stars",
          description: `Comfortable ${budget} hotel in ${location}`
        },
        {
          hotelName: `${location} ${budget} Hotel 3`,
          hotelAddress: `Downtown, ${location}`,
          price: budget === 'Cheap' ? "$20-40 per night" : budget === 'Luxury' ? "$200-350 per night" : "$60-100 per night",
          hotelImageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
          geoCoordinates: "36.1695, -115.1438",
          rating: budget === 'Luxury' ? "4.5 stars" : budget === 'Moderate' ? "3.5 stars" : "2.5 stars",
          description: `Budget-friendly accommodation in ${location}`
        }
      ];
    }
    
    const finalDays = parsedResponse.itinerary.length;
    console.log(`✅ Final result: ${finalDays} days, ${parsedResponse.hotels.length} hotels`);
    
    // Check if we achieved the target
    if (finalDays === targetDays) {
      return {
        ...parsedResponse,
        metadata: {
          generatedDays: finalDays,
          targetDays,
          success: true,
          attempt: retryCount + 1,
          completeness: 100
        }
      };
    }
    
    // Retry if we didn't get exact days and still have retries
    if (retryCount < maxRetries && finalDays !== targetDays) {
      console.log(`🔄 Retrying to get exact ${targetDays} days...`);
      await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500)));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    // Return what we have
    return {
      ...parsedResponse,
      metadata: {
        generatedDays: finalDays,
        targetDays,
        success: finalDays >= Math.ceil(targetDays * 0.8),
        attempt: retryCount + 1,
        completeness: Math.round((finalDays / targetDays) * 100)
      }
    };
    
  } catch (error) {
    console.error(`❌ Error in attempt ${retryCount + 1}:`, error);
    
    // Retry for network/API errors
    if (retryCount < maxRetries && (
      error.message.includes('network') || 
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('parse')
    )) {
      console.log(`🔄 Retrying due to error...`);
      await new Promise(resolve => setTimeout(resolve, 2000 + (retryCount * 1000)));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    throw new Error(`Failed to generate travel plan: ${error.message}`);
  }
};

// Original chatSession export for compatibility
export const chatSession = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [
        {text: "Generate Travel Plan for Location : Las Vegas, for 3 Days for Couple with a Cheap budget ,Give me a Hotels options list with HotelName, Hotel address, Price, hotel image url, geo coordinates, rating, descriptions and  suggest itinerary with placeName, Place Details, Place Image Url, Geo Coordinates, ticket Pricing, rating, Time travel each of the location for 3 days with each day plan with best time to visit in JSON format."},
      ],
    },
    {
      role: "model",
      parts: [
        {text: "```json\n{\n  \"hotels\": [\n    {\n      \"hotelName\": \"The D Las Vegas\",\n      \"hotelAddress\": \"301 Fremont Street, Las Vegas, NV 89101\",\n      \"price\": \"$50-$100 per night\",\n      \"hotelImageUrl\": \"https://www.theDcasino.com/images/hero/main-hero-02.jpg\",\n      \"geoCoordinates\": \"36.1695, -115.1438\",\n      \"rating\": \"3.5 stars\",\n      \"description\": \"A budget-friendly hotel located in downtown Las Vegas with a retro vibe. It features a casino, a pool, and several dining options.\"\n    },\n    {\n      \"hotelName\": \"Circus Circus Hotel & Casino\",\n      \"hotelAddress\": \"2880 Las Vegas Blvd S, Las Vegas, NV 89109\",\n      \"price\": \"$40-$80 per night\",\n      \"hotelImageUrl\": \"https://www.circuscircus.com/content/dam/caesars/circus-circus/home/hero-image.jpg\",\n      \"geoCoordinates\": \"36.1207, -115.1687\",\n      \"rating\": \"3 stars\",\n      \"description\": \"A classic Las Vegas hotel with a circus theme. It features a large casino, a midway with carnival rides, and several dining options.\"\n    }\n  ],\n  \"itinerary\": [\n    {\n      \"day\": \"Day 1\",\n      \"plan\": [\n        {\n          \"time\": \"9:00 AM - 12:00 PM\",\n          \"placeName\": \"Fremont Street Experience\",\n          \"placeDetails\": \"A pedestrian-friendly street in downtown Las Vegas with a canopy of lights and street performers. It's a great place to start your trip and get a feel for the city's energy.\",\n          \"placeImageUrl\": \"https://www.fremontstreetexperience.com/images/fremont-street-experience/fremont-street-experience.jpg\",\n          \"geoCoordinates\": \"36.1695, -115.1438\",\n          \"ticketPricing\": \"Free\",\n          \"timeToTravel\": \"1 hour\"\n        }\n      ]\n    }\n  ]\n}\n```"},
      ],
    },
  ],
});

// Legacy sendMessage function
export const sendMessage = async (promptText) => {
  try {
    const result = await chatSession.sendMessage(promptText);
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};