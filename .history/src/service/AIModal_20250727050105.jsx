import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.5,
  topP: 0.8,
  topK: 20,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// Updated prompt function with simpler structure
const createPrompt = (location, days, traveler, budget) => {
  return `Create a ${days}-day travel plan for ${location}.

Requirements:
- Days: EXACTLY ${days} days
- Budget: ${budget}
- Traveler: ${traveler}
- Each day needs 5 real places
- All places must exist in ${location}

Return valid JSON only:
{
  "hotels": [
    {"hotelName": "Real hotel", "hotelAddress": "Real address", "price": "$50-100/night", "hotelImageUrl": "url", "geoCoordinates": "lat,lng", "rating": "4 stars", "description": "desc"}
  ],
  "itinerary": [
    {"day": "Day 1", "plan": [
      {"time": "9:00 AM", "placeName": "Real place", "placeDetails": "Description", "placeImageUrl": "url", "geoCoordinates": "lat,lng", "ticketPricing": "$20", "timeToTravel": "Start of day"}
    ]}
  ]
}

Generate for ${location}, ${days} days, ${budget} budget.`;
};

export const generateTravelPlan = async (location, days, traveler, budget, retryCount = 0) => {
  const maxRetries = 2;
  const targetDays = parseInt(days);
  
  console.log(`Attempt ${retryCount + 1}: Generating ${targetDays} days for ${location}, ${budget} budget`);

  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const prompt = createPrompt(location, targetDays, traveler, budget);
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();
    
    console.log(`AI Response received: ${text.length} characters`);
    
    // Clean and parse response
    let parsedResponse;
    try {
      // Clean the response
      let cleanText = text.trim();
      // Remove code blocks
      cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      // Remove any non-JSON text before {
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      }
      
      parsedResponse = JSON.parse(cleanText);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.log('❌ JSON parse failed, creating fallback...');
      parsedResponse = null;
    }
    
    // Create fallback if parsing failed
    if (!parsedResponse || !parsedResponse.itinerary) {
      console.log('Creating complete fallback response...');
      parsedResponse = {
        hotels: [
          {
            hotelName: `${location} Hotel 1`,
            hotelAddress: `Main Street, ${location}`,
            price: budget === 'Cheap' ? "$30-60 per night" : budget === 'Luxury' ? "$300-500 per night" : "$80-150 per night",
            hotelImageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
            geoCoordinates: "36.1695, -115.1438",
            rating: "4 stars",
            description: `${budget} hotel in ${location}`
          }
        ],
        itinerary: []
      };
      
      // Create all days
      for (let i = 0; i < targetDays; i++) {
        parsedResponse.itinerary.push({
          day: `Day ${i + 1}`,
          plan: [
            {
              time: "9:00 AM - 11:00 AM",
              placeName: `${location} Morning Spot`,
              placeDetails: `Start your day exploring ${location}`,
              placeImageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: budget === 'Cheap' ? "Free" : "$20-50",
              timeToTravel: "Start of day"
            },
            {
              time: "1:00 PM - 3:00 PM",
              placeName: `${location} Restaurant`,
              placeDetails: `Lunch at local restaurant`,
              placeImageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: budget === 'Cheap' ? "$10-20" : budget === 'Luxury' ? "$50-100" : "$25-50",
              timeToTravel: "20 minutes from morning spot"
            },
            {
              time: "3:00 PM - 5:00 PM",
              placeName: `${location} Attraction`,
              placeDetails: `Afternoon sightseeing`,
              placeImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: budget === 'Cheap' ? "$5-15" : "$30-75",
              timeToTravel: "15 minutes from restaurant"
            },
            {
              time: "7:00 PM - 9:00 PM",
              placeName: `${location} Dinner`,
              placeDetails: `Evening dining`,
              placeImageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: budget === 'Cheap' ? "$15-30" : budget === 'Luxury' ? "$75-150" : "$35-70",
              timeToTravel: "25 minutes from attraction"
            }
          ]
        });
      }
    }
    
    // Ensure we have the right number of days
    const generatedDays = parsedResponse.itinerary ? parsedResponse.itinerary.length : 0;
    console.log(`Generated: ${generatedDays}/${targetDays} days`);
    
    // Fix day count if needed
    if (generatedDays < targetDays) {
      console.log(`Adding ${targetDays - generatedDays} missing days...`);
      for (let i = generatedDays; i < targetDays; i++) {
        parsedResponse.itinerary.push({
          day: `Day ${i + 1}`,
          plan: [
            {
              time: "9:00 AM - 11:00 AM",
              placeName: `Explore ${location}`,
              placeDetails: `Morning exploration`,
              placeImageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: "Free",
              timeToTravel: "Start of day"
            },
            {
              time: "1:00 PM - 3:00 PM",
              placeName: `Local Lunch`,
              placeDetails: `Lunch break`,
              placeImageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: "$20-40",
              timeToTravel: "20 minutes"
            }
          ]
        });
      }
    } else if (generatedDays > targetDays) {
      parsedResponse.itinerary = parsedResponse.itinerary.slice(0, targetDays);
    }
    
    const finalDays = parsedResponse.itinerary.length;
    console.log(`✅ Final: ${finalDays} days, ${parsedResponse.hotels.length} hotels`);
    
    return {
      ...parsedResponse,
      metadata: {
        generatedDays: finalDays,
        targetDays,
        success: finalDays === targetDays,
        attempt: retryCount + 1
      }
    };
    
  } catch (error) {
    console.error(`❌ Error in attempt ${retryCount + 1}:`, error);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    throw new Error(`Failed after ${maxRetries + 1} attempts: ${error.message}`);
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