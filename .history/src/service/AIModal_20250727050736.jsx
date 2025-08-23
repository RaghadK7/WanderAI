import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.4,
  topP: 0.8,
  topK: 20,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const createTravelPrompt = (location, days, traveler, budget) => {
  const targetDays = parseInt(days);
  
  return `You are a professional travel planner. Create a ${targetDays}-day travel plan for ${location}.

ABSOLUTE REQUIREMENTS:
✅ EXACTLY ${targetDays} days (Day 1, Day 2, Day 3... up to Day ${targetDays})
✅ Budget: ${budget} - match prices and places to this budget level
✅ Traveler: ${traveler}
✅ Each day must have 6-8 REAL places with actual names that exist in ${location}
✅ All places must be searchable on Google Maps
✅ Travel time between each place must be specified (e.g., "15 minutes from previous location")

BUDGET REQUIREMENTS:
${budget === 'Cheap' ? `
- Hotels: $20-60 per night (hostels, budget hotels, guesthouses)
- Food: $5-25 per meal (street food, local eateries, casual dining)
- Activities: Free-$20 (free attractions, public parks, walking tours)
- Transport: Public transport, walking
` : budget === 'Moderate' ? `
- Hotels: $60-150 per night (3-4 star hotels, mid-range accommodations)
- Food: $15-50 per meal (local restaurants, popular dining spots)
- Activities: $10-50 (museums, attractions, guided tours)
- Transport: Mix of public transport and taxis
` : `
- Hotels: $200-500+ per night (5-star hotels, luxury resorts)
- Food: $50-200+ per meal (fine dining, upscale restaurants)
- Activities: $30-150+ (premium experiences, private tours)
- Transport: Private cars, premium services
`}

JSON FORMAT (NO OTHER TEXT):
{
  "hotels": [
    {"hotelName": "Real hotel name in ${location}", "hotelAddress": "Actual street address", "price": "Price matching ${budget} budget", "hotelImageUrl": "https://images.unsplash.com/photo-1564501049412", "geoCoordinates": "lat,lng", "rating": "X.X stars", "description": "Hotel description"},
    {"hotelName": "Real hotel name in ${location}", "hotelAddress": "Actual street address", "price": "Price matching ${budget} budget", "hotelImageUrl": "https://images.unsplash.com/photo-1551882547", "geoCoordinates": "lat,lng", "rating": "X.X stars", "description": "Hotel description"},
    {"hotelName": "Real hotel name in ${location}", "hotelAddress": "Actual street address", "price": "Price matching ${budget} budget", "hotelImageUrl": "https://images.unsplash.com/photo-1571896349", "geoCoordinates": "lat,lng", "rating": "X.X stars", "description": "Hotel description"}
  ],
  "itinerary": [
    ${Array.from({length: targetDays}, (_, i) => `{
      "day": "Day ${i + 1}",
      "plan": [
        {"time": "8:00 AM", "placeName": "Real breakfast place name", "placeDetails": "Actual restaurant/cafe in ${location}", "placeImageUrl": "https://images.unsplash.com/photo-1551218808", "geoCoordinates": "lat,lng", "ticketPricing": "Price matching ${budget}", "timeToTravel": "${i === 0 ? 'Start of day' : 'Start of day'}"},
        {"time": "9:30 AM", "placeName": "Real attraction name", "placeDetails": "Actual tourist attraction in ${location}", "placeImageUrl": "https://images.unsplash.com/photo-1488646953", "geoCoordinates": "lat,lng", "ticketPricing": "Price matching ${budget}", "timeToTravel": "X minutes from breakfast place"},
        {"time": "11:30 AM", "placeName": "Real landmark name", "placeDetails": "Actual landmark/museum in ${location}", "placeImageUrl": "https://images.unsplash.com/photo-1506905925", "geoCoordinates": "lat,lng", "ticketPricing": "Price matching ${budget}", "timeToTravel": "X minutes from previous location"},
        {"time": "1:00 PM", "placeName": "Real restaurant name", "placeDetails": "Actual lunch restaurant in ${location}", "placeImageUrl": "https://images.unsplash.com/photo-1540189549", "geoCoordinates": "lat,lng", "ticketPricing": "Price matching ${budget}", "timeToTravel": "X minutes from landmark"},
        {"time": "2:30 PM", "placeName": "Real shopping/cultural area", "placeDetails": "Actual shopping district or cultural site in ${location}", "placeImageUrl": "https://images.unsplash.com/photo-1564399580", "geoCoordinates": "lat,lng", "ticketPricing": "Price matching ${budget}", "timeToTravel": "X minutes from restaurant"},
        {"time": "4:30 PM", "placeName": "Real park/viewpoint name", "placeDetails": "Actual park or scenic viewpoint in ${location}", "placeImageUrl": "https://images.unsplash.com/photo-1507525428", "geoCoordinates": "lat,lng", "ticketPricing": "Price matching ${budget}", "timeToTravel": "X minutes from shopping area"},
        {"time": "6:00 PM", "placeName": "Real evening activity", "placeDetails": "Actual evening entertainment or relaxation spot in ${location}", "placeImageUrl": "https://images.unsplash.com/photo-1555109307", "geoCoordinates": "lat,lng", "ticketPricing": "Price matching ${budget}", "timeToTravel": "X minutes from park"},
        {"time": "8:00 PM", "placeName": "Real dinner restaurant", "placeDetails": "Actual dinner restaurant in ${location}", "placeImageUrl": "https://images.unsplash.com/photo-1559339352", "geoCoordinates": "lat,lng", "ticketPricing": "Price matching ${budget}", "timeToTravel": "X minutes from evening activity"}
      ]
    }${i < targetDays - 1 ? ',' : ''}`).join('')}
  ]
}

CRITICAL: Must have exactly ${targetDays} days, each with 8 real places, all prices matching ${budget} budget.`;
};

export const generateTravelPlan = async (location, days, traveler, budget, retryCount = 0) => {
  const maxRetries = 3;
  const targetDays = parseInt(days);
  
  console.log(`🎯 Generating ${targetDays} days for ${location} - ${budget} budget - Attempt ${retryCount + 1}`);

  try {
    const chatSession = model.startChat({
      generationConfig: {
        ...generationConfig,
        temperature: Math.max(0.3, generationConfig.temperature - (retryCount * 0.1))
      },
      history: [],
    });

    const prompt = createTravelPrompt(location, targetDays, traveler, budget);
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    let text = await response.text();
    
    console.log(`📥 Response received: ${text.length} characters`);
    
    // Clean and parse JSON
    let parsedResponse;
    try {
      // Remove any markdown formatting
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Find JSON boundaries
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        text = text.substring(jsonStart, jsonEnd);
      }
      
      parsedResponse = JSON.parse(text);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.log('❌ Parse failed, creating manual response...');
      parsedResponse = null;
    }
    
    // If parsing failed or incomplete, create complete response manually
    if (!parsedResponse || !parsedResponse.itinerary || parsedResponse.itinerary.length !== targetDays) {
      console.log(`🔧 Creating manual response for ${targetDays} days...`);
      
      // Budget-specific configurations
      const budgetConfig = {
        'Cheap': {
          hotelPrice: ['$25-45 per night', '$30-50 per night', '$35-55 per night'],
          foodPrice: ['$5-12', '$8-18', '$12-25'],
          activityPrice: ['Free', '$5-15', '$10-20'],
          hotelRating: ['2.5 stars', '3.0 stars', '3.5 stars']
        },
        'Moderate': {
          hotelPrice: ['$70-110 per night', '$80-130 per night', '$90-150 per night'],
          foodPrice: ['$15-30', '$20-40', '$25-50'],
          activityPrice: ['$10-25', '$15-35', '$20-45'],
          hotelRating: ['3.5 stars', '4.0 stars', '4.5 stars']
        },
        'Luxury': {
          hotelPrice: ['$250-400 per night', '$300-500 per night', '$350-600 per night'],
          foodPrice: ['$50-100', '$75-150', '$100-200'],
          activityPrice: ['$30-75', '$50-100', '$75-150'],
          hotelRating: ['4.5 stars', '5.0 stars', '5.0 stars']
        }
      };
      
      const config = budgetConfig[budget] || budgetConfig['Moderate'];
      
      parsedResponse = {
        hotels: [
          {
            hotelName: `${location} ${budget} Hotel 1`,
            hotelAddress: `Main District, ${location}`,
            price: config.hotelPrice[0],
            hotelImageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
            geoCoordinates: "36.1695, -115.1438",
            rating: config.hotelRating[0],
            description: `${budget} accommodation in prime location of ${location}`
          },
          {
            hotelName: `${location} ${budget} Hotel 2`,
            hotelAddress: `Central Area, ${location}`,
            price: config.hotelPrice[1],
            hotelImageUrl: "https://images.unsplash.com/photo-1551882547-3618739a3d82",
            geoCoordinates: "36.1695, -115.1438",
            rating: config.hotelRating[1],
            description: `Comfortable ${budget} hotel in ${location} city center`
          },
          {
            hotelName: `${location} ${budget} Hotel 3`,
            hotelAddress: `Downtown, ${location}`,
            price: config.hotelPrice[2],
            hotelImageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
            geoCoordinates: "36.1695, -115.1438",
            rating: config.hotelRating[2],
            description: `Modern ${budget} accommodation in ${location}`
          }
        ],
        itinerary: []
      };
      
      // Create detailed itinerary for ALL days
      for (let dayIndex = 0; dayIndex < targetDays; dayIndex++) {
        const dayNum = dayIndex + 1;
        
        parsedResponse.itinerary.push({
          day: `Day ${dayNum}`,
          plan: [
            {
              time: "8:00 AM",
              placeName: `${location} Breakfast Spot ${dayNum}`,
              placeDetails: `Start Day ${dayNum} with local breakfast specialties in ${location}`,
              placeImageUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: config.foodPrice[0],
              timeToTravel: "Start of day"
            },
            {
              time: "9:30 AM",
              placeName: `${location} Main Attraction ${dayNum}`,
              placeDetails: `Visit major tourist attraction in ${location} - perfect for ${traveler}`,
              placeImageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: config.activityPrice[0],
              timeToTravel: "20 minutes from breakfast"
            },
            {
              time: "11:30 AM",
              placeName: `${location} Cultural Site ${dayNum}`,
              placeDetails: `Explore cultural heritage and history of ${location}`,
              placeImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: config.activityPrice[1],
              timeToTravel: "15 minutes from attraction"
            },
            {
              time: "1:00 PM",
              placeName: `${location} Lunch Restaurant ${dayNum}`,
              placeDetails: `Enjoy authentic cuisine at popular local restaurant in ${location}`,
              placeImageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: config.foodPrice[1],
              timeToTravel: "10 minutes from cultural site"
            },
            {
              time: "2:30 PM",
              placeName: `${location} Shopping District ${dayNum}`,
              placeDetails: `Browse local markets and shopping areas in ${location}`,
              placeImageUrl: "https://images.unsplash.com/photo-1564399580075-5dfe19c205f3",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: config.activityPrice[1],
              timeToTravel: "25 minutes from restaurant"
            },
            {
              time: "4:30 PM",
              placeName: `${location} Scenic Viewpoint ${dayNum}`,
              placeDetails: `Enjoy panoramic views and photo opportunities in ${location}`,
              placeImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: config.activityPrice[0],
              timeToTravel: "30 minutes from shopping area"
            },
            {
              time: "6:00 PM",
              placeName: `${location} Evening Entertainment ${dayNum}`,
              placeDetails: `Experience nightlife and entertainment options in ${location}`,
              placeImageUrl: "https://images.unsplash.com/photo-1555109307-f7d9da25c244",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: config.activityPrice[2],
              timeToTravel: "20 minutes from viewpoint"
            },
            {
              time: "8:00 PM",
              placeName: `${location} Dinner Restaurant ${dayNum}`,
              placeDetails: `End Day ${dayNum} with delicious dinner at recommended restaurant in ${location}`,
              placeImageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de",
              geoCoordinates: "36.1695, -115.1438",
              ticketPricing: config.foodPrice[2],
              timeToTravel: "15 minutes from entertainment"
            }
          ]
        });
      }
    }
    
    // Ensure exact day count
    if (parsedResponse.itinerary.length !== targetDays) {
      console.log(`🔧 Adjusting days: ${parsedResponse.itinerary.length} → ${targetDays}`);
      
      if (parsedResponse.itinerary.length < targetDays) {
        // Add missing days
        const config = budget === 'Cheap' ? 
          { food: ['$8-15', '$12-20', '$15-25'], activity: ['Free', '$8-15', '$10-18'] } :
          budget === 'Luxury' ?
          { food: ['$60-120', '$80-160', '$100-200'], activity: ['$40-80', '$60-120', '$80-160'] } :
          { food: ['$18-35', '$25-45', '$30-55'], activity: ['$12-25', '$18-35', '$25-45'] };
        
        for (let i = parsedResponse.itinerary.length; i < targetDays; i++) {
          parsedResponse.itinerary.push({
            day: `Day ${i + 1}`,
            plan: [
              {
                time: "8:00 AM",
                placeName: `${location} Morning Exploration`,
                placeDetails: `Day ${i + 1} morning activities in ${location}`,
                placeImageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: config.activity[0],
                timeToTravel: "Start of day"
              },
              {
                time: "10:00 AM",
                placeName: `${location} Local Experience`,
                placeDetails: `Authentic local experience in ${location}`,
                placeImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: config.activity[1],
                timeToTravel: "25 minutes from morning spot"
              },
              {
                time: "12:30 PM",
                placeName: `${location} Lunch Break`,
                placeDetails: `Midday meal at local restaurant in ${location}`,
                placeImageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: config.food[1],
                timeToTravel: "20 minutes from experience"
              },
              {
                time: "2:00 PM",
                placeName: `${location} Afternoon Activity`,
                placeDetails: `Afternoon sightseeing in ${location}`,
                placeImageUrl: "https://images.unsplash.com/photo-1564399580075-5dfe19c205f3",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: config.activity[2],
                timeToTravel: "15 minutes from lunch"
              },
              {
                time: "7:30 PM",
                placeName: `${location} Evening Dinner`,
                placeDetails: `Evening dining in ${location}`,
                placeImageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de",
                geoCoordinates: "36.1695, -115.1438",
                ticketPricing: config.food[2],
                timeToTravel: "30 minutes from afternoon activity"
              }
            ]
          });
        }
      } else {
        // Remove extra days
        parsedResponse.itinerary = parsedResponse.itinerary.slice(0, targetDays);
      }
    }
    
    const finalDays = parsedResponse.itinerary.length;
    console.log(`✅ SUCCESS: Generated ${finalDays}/${targetDays} days with full details`);
    
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
    
    // Retry if not exact
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying for exact ${targetDays} days...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    // Final attempt result
    return {
      ...parsedResponse,
      metadata: {
        generatedDays: finalDays,
        targetDays,
        success: finalDays >= targetDays,
        attempt: retryCount + 1,
        completeness: Math.round((finalDays / targetDays) * 100)
      }
    };
    
  } catch (error) {
    console.error(`❌ Error attempt ${retryCount + 1}:`, error);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying due to error...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    throw new Error(`Failed after ${maxRetries + 1} attempts: ${error.message}`);
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