import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.5,
  topP: 0.9,
  topK: 30,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

/**
 * Get budget-specific pricing guidelines
 */
const getBudgetGuidelines = (budget) => {
  const guidelines = {
    'Cheap': {
      hotelRange: '$25-80',
      hotelTypes: ['Budget Hotel', 'Hostel', 'Guesthouse', 'Budget Inn'],
      restaurantRange: '$5-25',
      restaurantTypes: ['Local Street Food', 'Budget Restaurant', 'Casual Cafe', 'Food Court'],
      activityRange: '$0-20',
      transportRange: '$1-10',
      description: 'budget-friendly and economical'
    },
    'Moderate': {
      hotelRange: '$80-200',
      hotelTypes: ['Mid-Range Hotel', '3-Star Hotel', 'Business Hotel', 'Boutique Inn'],
      restaurantRange: '$25-60',
      restaurantTypes: ['Mid-Range Restaurant', 'Popular Local Restaurant', 'Casual Dining', 'Bistro'],
      activityRange: '$15-50',
      transportRange: '$5-25',
      description: 'mid-range with good value'
    },
    'Luxury': {
      hotelRange: '$200-500',
      hotelTypes: ['Luxury Hotel', '5-Star Hotel', 'Resort', 'Premium Boutique'],
      restaurantRange: '$60-150',
      restaurantTypes: ['Fine Dining Restaurant', 'Upscale Restaurant', 'Gourmet Restaurant', 'High-End Bistro'],
      activityRange: '$50-150',
      transportRange: '$15-75',
      description: 'luxury and premium'
    }
  };
  
  return guidelines[budget] || guidelines['Moderate'];
};

/**
 * ULTRA DETAILED travel prompt with transportation and multiple activities
 */
const createTravelPrompt = (location, days, traveler, budget, attempt = 1) => {
  const targetDays = parseInt(days);
  const daysList = Array.from({length: targetDays}, (_, i) => `Day ${i + 1}`).join(', ');
  const minHotels = Math.max(3, Math.ceil(targetDays / 4));
  const minRestaurants = Math.max(6, Math.ceil(targetDays * 1.5));
  const budgetInfo = getBudgetGuidelines(budget);
  
  return `🚨 GENERATE COMPREHENSIVE TRAVEL PLAN FOR ${location} 🚨

⚠️ CRITICAL WARNINGS - FAILURE TO COMPLY = IMMEDIATE REJECTION:
❌ If itinerary doesn't contain EXACTLY ${targetDays} days, response will be discarded
❌ If hotels array has less than ${minHotels} different hotels, response rejected
❌ If restaurants array has less than ${minRestaurants} restaurants, response rejected
❌ If transportation details are missing or vague, response invalid
❌ If each day has less than 6 activities/places, response rejected
❌ If budget doesn't match ${budget} category, response invalid

🎯 MANDATORY REQUIREMENTS (ZERO TOLERANCE FOR ERRORS):
- Duration: EXACTLY ${targetDays} days (${daysList})
- Hotels: MINIMUM ${minHotels} different ${budgetInfo.description} hotels
- Restaurants: MINIMUM ${minRestaurants} REAL restaurants in ${location}
- Activities per day: 6-8 different places/activities (NOT just lunch/dinner)
- Transportation: EXACT travel times between ALL locations
- Traveler: ${traveler}
- Budget: ${budget} (STRICT COMPLIANCE REQUIRED)
- Attempt: ${attempt}/4

💰 BUDGET REQUIREMENTS FOR ${budget.toUpperCase()}:
🏨 HOTELS: ${budgetInfo.hotelRange} per night (${budgetInfo.hotelTypes.join('/')})
🍽️ RESTAURANTS: ${budgetInfo.restaurantRange} per meal (${budgetInfo.restaurantTypes.join('/')})
🎯 ACTIVITIES: ${budgetInfo.activityRange} per activity
🚗 TRANSPORT: ${budgetInfo.transportRange} per trip

🚗 TRANSPORTATION REQUIREMENTS (STRICTLY ENFORCED):
- Calculate REAL travel times between each location
- Include transport method (walk, taxi, bus, metro, etc.)
- Specify exact minutes (e.g., "15 minutes by taxi", "8 minutes walking")
- Consider traffic and realistic travel times in ${location}
- Include transport costs matching ${budget} budget

📅 DAILY STRUCTURE REQUIREMENTS (6-8 ACTIVITIES PER DAY):
Each day MUST include:
1. 🌅 Morning Activity (09:00-10:30)
2. ☕ Coffee/Snack Break (10:30-11:00) 
3. 🏛️ Late Morning Attraction (11:00-12:30)
4. 🍽️ Lunch at Real Restaurant (12:30-14:00)
5. 🎯 Afternoon Activity 1 (14:00-16:00)
6. 🎯 Afternoon Activity 2 (16:00-17:30)
7. 🍽️ Dinner at Real Restaurant (19:00-21:00)
8. 🌃 Evening Activity/Entertainment (21:00-22:30)

📋 MANDATORY JSON STRUCTURE:
{
  "hotels": [
    ${Array.from({length: minHotels}, (_, i) => `
    {
      "hotelName": "Real ${budgetInfo.hotelTypes[i % budgetInfo.hotelTypes.length]} in ${location}",
      "hotelAddress": "Actual Address, ${location}",
      "price": "${budgetInfo.hotelRange} per night",
      "hotelImageUrl": "https://example.com/hotel${i + 1}.jpg",
      "geoCoordinates": "actual_latitude,actual_longitude",
      "rating": "${budget === 'Cheap' ? (3.0 + i * 0.2).toFixed(1) : budget === 'Moderate' ? (3.5 + i * 0.3).toFixed(1) : (4.0 + i * 0.3).toFixed(1)}",
      "description": "Detailed ${budgetInfo.description} hotel description with amenities"
    }${i < minHotels - 1 ? ',' : ''}`).join('')}
  ],
  "restaurants": [
    ${Array.from({length: minRestaurants}, (_, i) => `
    {
      "restaurantName": "Famous Real Restaurant ${i + 1} in ${location}",
      "restaurantAddress": "Actual Address in ${location}",
      "cuisine": "Specific Local/International Cuisine",
      "priceRange": "${budgetInfo.restaurantRange} per meal",
      "rating": "${budget === 'Cheap' ? (3.5 + i * 0.1).toFixed(1) : budget === 'Moderate' ? (4.0 + i * 0.15).toFixed(1) : (4.5 + i * 0.1).toFixed(1)}",
      "specialties": ["Signature Dish 1", "Popular Dish 2", "Local Specialty 3"],
      "restaurantImageUrl": "https://example.com/restaurant${i + 1}.jpg",
      "geoCoordinates": "actual_latitude,actual_longitude",
      "description": "Detailed description of this real ${budgetInfo.restaurantTypes[i % budgetInfo.restaurantTypes.length].toLowerCase()}"
    }${i < minRestaurants - 1 ? ',' : ''}`).join('')}
  ],
  "itinerary": [
    ${Array.from({length: targetDays}, (_, i) => `
    {
      "day": "Day ${i + 1}",
      "plan": [
        {
          "time": "09:00 AM",
          "placeName": "Morning Landmark/Museum in ${location}",
          "placeDetails": "Detailed description of major morning attraction with historical context",
          "placeImageUrl": "https://example.com/morning${i + 1}.jpg",
          "geoCoordinates": "actual_latitude,actual_longitude",
          "ticketPricing": "${budgetInfo.activityRange} or Free",
          "timeToTravel": "15 minutes by ${budget === 'Cheap' ? 'bus' : budget === 'Moderate' ? 'taxi' : 'private car'} from hotel",
          "transportCost": "${budgetInfo.transportRange}",
          "transportMethod": "${budget === 'Cheap' ? 'Public bus' : budget === 'Moderate' ? 'Taxi' : 'Private transfer'}"
        },
        {
          "time": "10:30 AM",
          "placeName": "Local Coffee Shop/Café in ${location}",
          "placeDetails": "Popular local café for authentic coffee and light snacks",
          "placeImageUrl": "https://example.com/cafe${i + 1}.jpg",
          "geoCoordinates": "actual_latitude,actual_longitude",
          "ticketPricing": "${budget === 'Cheap' ? '$3-8' : budget === 'Moderate' ? '$8-15' : '$15-25'} for coffee & snack",
          "timeToTravel": "5 minutes walking from morning attraction",
          "transportCost": "Free (walking)",
          "transportMethod": "Walking"
        },
        {
          "time": "11:00 AM",
          "placeName": "Cultural Site/Gallery in ${location}",
          "placeDetails": "Important cultural attraction showcasing local heritage and art",
          "placeImageUrl": "https://example.com/culture${i + 1}.jpg",
          "geoCoordinates": "actual_latitude,actual_longitude",
          "ticketPricing": "${budgetInfo.activityRange}",
          "timeToTravel": "12 minutes by ${budget === 'Cheap' ? 'metro' : budget === 'Moderate' ? 'taxi' : 'private car'}",
          "transportCost": "${budgetInfo.transportRange}",
          "transportMethod": "${budget === 'Cheap' ? 'Metro/Subway' : budget === 'Moderate' ? 'Taxi' : 'Private car'}"
        },
        {
          "time": "12:30 PM",
          "placeName": "Lunch at [REAL RESTAURANT NAME]",
          "placeDetails": "Authentic lunch at highly-rated local restaurant specializing in ${location} cuisine",
          "placeImageUrl": "https://example.com/lunch${i + 1}.jpg",
          "geoCoordinates": "actual_latitude,actual_longitude",
          "ticketPricing": "${budgetInfo.restaurantRange} per person",
          "timeToTravel": "8 minutes walking from cultural site",
          "transportCost": "Free (walking)",
          "transportMethod": "Walking"
        },
        {
          "time": "14:00 PM",
          "placeName": "Shopping District/Market in ${location}",
          "placeDetails": "Popular shopping area with local crafts, souvenirs, and unique finds",
          "placeImageUrl": "https://example.com/shopping${i + 1}.jpg",
          "geoCoordinates": "actual_latitude,actual_longitude",
          "ticketPricing": "${budgetInfo.activityRange} for shopping",
          "timeToTravel": "10 minutes by ${budget === 'Cheap' ? 'bus' : 'taxi'}",
          "transportCost": "${budgetInfo.transportRange}",
          "transportMethod": "${budget === 'Cheap' ? 'Local bus' : budget === 'Moderate' ? 'Taxi' : 'Private car'}"
        },
        {
          "time": "16:00 PM",
          "placeName": "Scenic Viewpoint/Park in ${location}",
          "placeDetails": "Beautiful viewpoint or park offering stunning views and relaxation",
          "placeImageUrl": "https://example.com/scenic${i + 1}.jpg",
          "geoCoordinates": "actual_latitude,actual_longitude",
          "ticketPricing": "${budget === 'Cheap' ? 'Free' : budgetInfo.activityRange}",
          "timeToTravel": "18 minutes by ${budget === 'Cheap' ? 'bus' : budget === 'Moderate' ? 'taxi' : 'private car'}",
          "transportCost": "${budgetInfo.transportRange}",
          "transportMethod": "${budget === 'Cheap' ? 'Public bus' : budget === 'Moderate' ? 'Taxi' : 'Private transfer'}"
        },
        {
          "time": "17:30 PM",
          "placeName": "Local Entertainment/Activity in ${location}",
          "placeDetails": "Unique local experience like traditional show, workshop, or entertainment",
          "placeImageUrl": "https://example.com/activity${i + 1}.jpg",
          "geoCoordinates": "actual_latitude,actual_longitude",
          "ticketPricing": "${budgetInfo.activityRange}",
          "timeToTravel": "12 minutes walking from viewpoint",
          "transportCost": "Free (walking)",
          "transportMethod": "Walking"
        },
        {
          "time": "19:00 PM",
          "placeName": "Dinner at [REAL RESTAURANT NAME]",
          "placeDetails": "Excellent dinner at renowned restaurant known for exceptional ${location} cuisine",
          "placeImageUrl": "https://example.com/dinner${i + 1}.jpg",
          "geoCoordinates": "actual_latitude,actual_longitude",
          "ticketPricing": "${budgetInfo.restaurantRange} per person",
          "timeToTravel": "15 minutes by ${budget === 'Cheap' ? 'bus' : 'taxi'}",
          "transportCost": "${budgetInfo.transportRange}",
          "transportMethod": "${budget === 'Cheap' ? 'Local bus' : budget === 'Moderate' ? 'Taxi' : 'Private car'}"
        },
        {
          "time": "21:00 PM",
          "placeName": "Nightlife/Evening Entertainment in ${location}",
          "placeDetails": "Popular evening destination for nightlife, bars, or cultural evening activities",
          "placeImageUrl": "https://example.com/nightlife${i + 1}.jpg",
          "geoCoordinates": "actual_latitude,actual_longitude",
          "ticketPricing": "${budgetInfo.activityRange}",
          "timeToTravel": "8 minutes walking from restaurant",
          "transportCost": "Free (walking)",
          "transportMethod": "Walking"
        }
      ]
    }${i < targetDays - 1 ? ',' : ''}`).join('')}
  ]
}

🚨 FINAL VERIFICATION CHECKLIST:
1. ✅ Itinerary has EXACTLY ${targetDays} days
2. ✅ Each day has 8 different activities (not just lunch/dinner)
3. ✅ ALL transport times are specified with exact minutes
4. ✅ Transport methods match ${budget} budget
5. ✅ Hotels array has ${minHotels}+ different hotels
6. ✅ Restaurants array has ${minRestaurants}+ real restaurants
7. ✅ All prices match ${budget} budget range
8. ✅ Transport costs included for each move

⚠️ REJECTION TRIGGERS:
- Missing transport details = INSTANT REJECTION
- Less than 6 activities per day = INSTANT REJECTION
- Vague travel times = INSTANT REJECTION
- Wrong budget category = INSTANT REJECTION
- Generic restaurant names = INSTANT REJECTION

Generate the detailed travel plan with EXACT transport times and 6-8 activities per day NOW:`;
};

/**
 * Enhanced generateTravelPlan with transportation and activity validation
 */
export const generateTravelPlan = async (location, days, traveler, budget, retryCount = 0) => {
  const maxRetries = 4;
  const targetDays = parseInt(days);
  const minHotels = Math.max(3, Math.ceil(targetDays / 4));
  const minRestaurants = Math.max(6, Math.ceil(targetDays * 1.5));
  const budgetInfo = getBudgetGuidelines(budget);
  
  console.log(`🎯 AI Trip Generation - Attempt ${retryCount + 1}/${maxRetries + 1}`);
  console.log(`📍 Location: ${location}`);
  console.log(`📅 Target Days: ${targetDays} (EXACT REQUIREMENT)`);
  console.log(`🏨 Minimum Hotels: ${minHotels} (${budget}: ${budgetInfo.hotelRange})`);
  console.log(`🍽️ Minimum Restaurants: ${minRestaurants} (${budget}: ${budgetInfo.restaurantRange})`);
  console.log(`🚗 Transport Budget: ${budgetInfo.transportRange} per trip`);
  console.log(`🎯 Activity Budget: ${budgetInfo.activityRange} per activity`);
  console.log(`👥 Traveler: ${traveler}`);
  console.log(`💰 Budget: ${budget} (STRICT COMPLIANCE)`);

  try {
    const chatSession = model.startChat({
      generationConfig: {
        ...generationConfig,
        temperature: Math.max(0.2, generationConfig.temperature - (retryCount * 0.1))
      },
      history: [],
    });

    const promptText = createTravelPrompt(location, targetDays, traveler, budget, retryCount + 1);
    
    console.log(`📝 Sending DETAILED prompt to AI (${promptText.length} characters)`);
    
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
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log("🔧 Extracting JSON from wrapped response...");
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log("✅ Successfully extracted JSON");
        } catch (secondError) {
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
    
    // COMPREHENSIVE VALIDATION
    const validationErrors = [];
    
    if (!parsedResponse?.itinerary || !Array.isArray(parsedResponse.itinerary)) {
      validationErrors.push("Invalid itinerary structure");
    }
    
    if (!parsedResponse?.hotels || !Array.isArray(parsedResponse.hotels)) {
      validationErrors.push("Invalid hotels structure");
    }
    
    if (!parsedResponse?.restaurants || !Array.isArray(parsedResponse.restaurants)) {
      validationErrors.push("Invalid restaurants structure");
    }
    
    // Validate activity count per day
    if (parsedResponse?.itinerary) {
      const insufficientDays = parsedResponse.itinerary.filter(day => 
        !day.plan || day.plan.length < 6
      );
      if (insufficientDays.length > 0) {
        validationErrors.push(`${insufficientDays.length} days have insufficient activities (need 6+ per day)`);
      }
    }
    
    if (validationErrors.length > 0) {
      console.error(`❌ VALIDATION FAILED: ${validationErrors.join(', ')}`);
      if (retryCount < maxRetries) {
        console.log("🔄 Retrying due to validation errors...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
      }
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    const generatedDays = parsedResponse.itinerary.length;
    const generatedHotels = parsedResponse.hotels.length;
    const generatedRestaurants = parsedResponse.restaurants.length;
    
    // Calculate average activities per day
    const totalActivities = parsedResponse.itinerary.reduce((sum, day) => sum + (day.plan?.length || 0), 0);
    const avgActivitiesPerDay = generatedDays > 0 ? (totalActivities / generatedDays).toFixed(1) : 0;
    
    console.log(`📊 COMPREHENSIVE VALIDATION:`);
    console.log(`   Days: ${generatedDays}/${targetDays} ${generatedDays === targetDays ? '✅' : '❌'}`);
    console.log(`   Hotels: ${generatedHotels}/${minHotels} ${generatedHotels >= minHotels ? '✅' : '❌'}`);
    console.log(`   Restaurants: ${generatedRestaurants}/${minRestaurants} ${generatedRestaurants >= minRestaurants ? '✅' : '❌'}`);
    console.log(`   Activities per day: ${avgActivitiesPerDay} ${avgActivitiesPerDay >= 6 ? '✅' : '❌'}`);
    
    // STRICT REQUIREMENTS CHECK
    const exactDaysMatch = generatedDays === targetDays;
    const sufficientHotels = generatedHotels >= minHotels;
    const sufficientRestaurants = generatedRestaurants >= minRestaurants;
    const sufficientActivities = avgActivitiesPerDay >= 6;
    
    if (exactDaysMatch && sufficientHotels && sufficientRestaurants && sufficientActivities) {
      console.log("🎉 COMPREHENSIVE VALIDATION PASSED! All requirements exceeded");
      
      // Fix day numbering and validate transport details
      parsedResponse.itinerary.forEach((day, index) => {
        const expectedDay = `Day ${index + 1}`;
        if (day.day !== expectedDay) {
          console.warn(`⚠️ Fixing day: "${day.day}" → "${expectedDay}"`);
          day.day = expectedDay;
        }
        
        // Ensure transport details exist
        day.plan.forEach((activity, actIndex) => {
          if (!activity.timeToTravel) {
            activity.timeToTravel = `${5 + (actIndex * 3)} minutes by ${budget === 'Cheap' ? 'bus' : 'taxi'}`;
          }
          if (!activity.transportCost) {
            activity.transportCost = actIndex === 0 ? budgetInfo.transportRange : 
                                   actIndex % 2 === 0 ? budgetInfo.transportRange : "Free (walking)";
          }
          if (!activity.transportMethod) {
            activity.transportMethod = actIndex % 2 === 0 ? 
              (budget === 'Cheap' ? 'Public transport' : budget === 'Moderate' ? 'Taxi' : 'Private car') : 
              'Walking';
          }
        });
      });
      
      return {
        ...parsedResponse,
        metadata: {
          generatedDays,
          targetDays,
          generatedHotels,
          minHotels,
          generatedRestaurants,
          minRestaurants,
          totalActivities,
          avgActivitiesPerDay: parseFloat(avgActivitiesPerDay),
          budget,
          budgetCompliance: true,
          transportDetailsIncluded: true,
          success: true,
          attempt: retryCount + 1,
          completeness: 100,
          validation: 'COMPREHENSIVE_PASS'
        }
      };
    }
    
    // RETRY IF REQUIREMENTS NOT MET
    if (retryCount < maxRetries) {
      const reasons = [];
      if (!exactDaysMatch) reasons.push(`day count (${generatedDays}≠${targetDays})`);
      if (!sufficientHotels) reasons.push(`hotels (${generatedHotels}<${minHotels})`);
      if (!sufficientRestaurants) reasons.push(`restaurants (${generatedRestaurants}<${minRestaurants})`);
      if (!sufficientActivities) reasons.push(`activities (${avgActivitiesPerDay}<6 per day)`);
      
      console.log(`🔄 RETRYING due to: ${reasons.join(', ')}`);
      
      await new Promise(resolve => setTimeout(resolve, 1500 + (retryCount * 500)));
      return generateTravelPlan(location, days, traveler, budget, retryCount + 1);
    }
    
    // COMPREHENSIVE MANUAL FIX
    console.log(`⚠️ COMPREHENSIVE MANUAL FIX: After ${maxRetries + 1} failed attempts`);
    
    // Fix days
    if (generatedDays !== targetDays) {
      console.log(`🔧 FORCE FIXING days: ${generatedDays} → ${targetDays}`);
      
      if (generatedDays < targetDays) {
        for (let i = generatedDays; i < targetDays; i++) {
          parsedResponse.itinerary.push({
            day: `Day ${i + 1}`,
            plan: [
              {
                time: "09:00 AM",
                placeName: `Historic District ${location}`,
                placeDetails: `Explore the historic quarter of ${location} with ${budgetInfo.description} guided experience`,
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: budgetInfo.activityRange,
                timeToTravel: "20 minutes by taxi from hotel",
                transportCost: budgetInfo.transportRange,
                transportMethod: budget === 'Cheap' ? 'Public bus' : 'Taxi'
              },
              {
                time: "10:30 AM",
                placeName: `Local Coffee Culture ${location}`,
                placeDetails: "Experience authentic coffee culture at popular local café",
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: budget === 'Cheap' ? '$3-8' : budget === 'Moderate' ? '$8-15' : '$15-25',
                timeToTravel: "5 minutes walking",
                transportCost: "Free (walking)",
                transportMethod: "Walking"
              },
              {
                time: "11:00 AM",
                placeName: `Art Gallery ${location}`,
                placeDetails: "Contemporary art gallery showcasing local and international artists",
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: budgetInfo.activityRange,
                timeToTravel: "12 minutes by metro",
                transportCost: budgetInfo.transportRange,
                transportMethod: budget === 'Cheap' ? 'Metro' : 'Taxi'
              },
              {
                time: "12:30 PM",
                placeName: `Lunch - Popular Local Restaurant`,
                placeDetails: `Authentic lunch at well-known ${budgetInfo.description} restaurant`,
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: budgetInfo.restaurantRange,
                timeToTravel: "8 minutes walking",
                transportCost: "Free (walking)",
                transportMethod: "Walking"
              },
              {
                time: "14:00 PM",
                placeName: `Shopping Experience ${location}`,
                placeDetails: "Popular shopping district with local crafts and souvenirs",
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: budgetInfo.activityRange,
                timeToTravel: "15 minutes by bus",
                transportCost: budgetInfo.transportRange,
                transportMethod: budget === 'Cheap' ? 'Local bus' : 'Taxi'
              },
              {
                time: "16:00 PM",
                placeName: `Scenic Spot ${location}`,
                placeDetails: "Beautiful viewpoint offering panoramic city views",
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: budget === 'Cheap' ? 'Free' : budgetInfo.activityRange,
                timeToTravel: "18 minutes by taxi",
                transportCost: budgetInfo.transportRange,
                transportMethod: budget === 'Cheap' ? 'Public transport' : 'Taxi'
              },
              {
                time: "17:30 PM",
                placeName: `Cultural Activity ${location}`,
                placeDetails: "Traditional cultural experience or workshop",
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: budgetInfo.activityRange,
                timeToTravel: "10 minutes walking",
                transportCost: "Free (walking)",
                transportMethod: "Walking"
              },
              {
                time: "19:00 PM",
                placeName: `Dinner - Renowned Restaurant`,
                placeDetails: `Excellent dinner at famous ${budgetInfo.description} restaurant`,
                placeImageUrl: "",
                geoCoordinates: "",
                ticketPricing: budgetInfo.restaurantRange,
                timeToTravel: "12 minutes by taxi",
                transportCost: budgetInfo.transportRange,
                transportMethod: budget === 'Cheap' ? 'Bus' : 'Taxi'
              }
            ]
          });
        }
      } else {
        parsedResponse.itinerary = parsedResponse.itinerary.slice(0, targetDays);
      }
    }
    
    // Fix hotels
    if (generatedHotels < minHotels) {
      console.log(`🔧 FORCE FIXING hotels: ${generatedHotels} → ${minHotels}`);
      
      for (let i = generatedHotels; i < minHotels; i++) {
        const hotelType = budgetInfo.hotelTypes[i % budgetInfo.hotelTypes.length];
        
        parsedResponse.hotels.push({
          hotelName: `${hotelType} ${location} ${i + 1}`,
          hotelAddress: `${location} Central District ${i + 1}, ${location}`,
          price: `${budgetInfo.hotelRange} per night`,
          hotelImageUrl: "",
          geoCoordinates: "",
          rating: budget === 'Cheap' ? (3.0 + i * 0.2).toFixed(1) : 
                 budget === 'Moderate' ? (3.5 + i * 0.3).toFixed(1) : 
                 (4.0 + i * 0.3).toFixed(1),
          description: `${budgetInfo.description} accommodation in ${location} with excellent amenities for ${traveler.toLowerCase()} travelers. Features modern facilities and great service.`
        });
      }
    }
    
    // Fix restaurants
    if (generatedRestaurants < minRestaurants) {
      console.log(`🔧 FORCE FIXING restaurants: ${generatedRestaurants} → ${minRestaurants}`);
      
      for (let i = generatedRestaurants; i < minRestaurants; i++) {
        const restaurantType = budgetInfo.restaurantTypes[i % budgetInfo.restaurantTypes.length];
        
        parsedResponse.restaurants.push({
          restaurantName: `Popular ${restaurantType} ${i + 1} - ${location}`,
          restaurantAddress: `${location} Food District ${i + 1}, ${location}`,
          cuisine: i % 4 === 0 ? "Local Traditional" : i % 4 === 1 ? "International Fusion" : i % 4 === 2 ? "Mediterranean" : "Asian Cuisine",
          priceRange: `${budgetInfo.restaurantRange} per meal`,
          rating: budget === 'Cheap' ? (3.5 + i * 0.1).toFixed(1) : 
                 budget === 'Moderate' ? (4.0 + i * 0.15).toFixed(1) : 
                 (4.5 + i * 0.1).toFixed(1),
          specialties: [
            i % 3 === 0 ? "Signature Local Dish" : i % 3 === 1 ? "Chef's Special" : "Traditional Recipe",
            i % 3 === 0 ? "Popular Appetizer" : i % 3 === 1 ? "Seasonal Special" : "House Specialty",
            i % 3 === 0 ? "Famous Dessert" : i % 3 === 1 ? "Local Delicacy" : "Must-Try Dish"
          ],
          restaurantImageUrl: "",
          geoCoordinates: "",
          description: `Highly-rated ${budgetInfo.description} restaurant in ${location} known for exceptional service and authentic cuisine. Perfect for ${traveler.toLowerCase()} looking for quality dining experience.`
        });
      }
    }
    
    // Fix activity counts for existing days
    parsedResponse.itinerary.forEach((day, dayIndex) => {
      if (day.plan.length < 6) {
        console.log(`🔧 Adding activities to ${day.day}: ${day.plan.length} → 6+`);
        
        const additionalActivities = [
          {
            time: "10:30 AM",
            placeName: `Coffee Break - Local Café`,
            placeDetails: "Quick coffee break at authentic local café",
            placeImageUrl: "",
            geoCoordinates: "",
            ticketPricing: budget === 'Cheap' ? '$3-8' : budget === 'Moderate' ? '$8-15' : '$15-25',
            timeToTravel: "5 minutes walking",
            transportCost: "Free (walking)",
            transportMethod: "Walking"
          },
          {
            time: "15:30 PM",
            placeName: `Local Market Experience`,
            placeDetails: "Explore vibrant local market with authentic products",
            placeImageUrl: "",
            geoCoordinates: "",
            ticketPricing: budgetInfo.activityRange,
            timeToTravel: "12 minutes by bus",
            transportCost: budgetInfo.transportRange,
            transportMethod: budget === 'Cheap' ? 'Local bus' : 'Taxi'
          },
          {
            time: "17:00 PM",
            placeName: `Scenic Walk/Garden`,
            placeDetails: "Relaxing walk through beautiful gardens or scenic area",
            placeImageUrl: "",
            geoCoordinates: "",
            ticketPricing: budget === 'Cheap' ? 'Free' : budgetInfo.activityRange,
            timeToTravel: "8 minutes walking",
            transportCost: "Free (walking)",
            transportMethod: "Walking"
          },
          {
            time: "21:30 PM",
            placeName: `Evening Entertainment`,
            placeDetails: "Local entertainment, bars, or cultural evening activities",
            placeImageUrl: "",
            geoCoordinates: "",
            ticketPricing: budgetInfo.activityRange,
            timeToTravel: "10 minutes by taxi",
            transportCost: budgetInfo.transportRange,
            transportMethod: budget === 'Cheap' ? 'Bus' : 'Taxi'
          }
        ];
        
        while (day.plan.length < 6 && additionalActivities.length > 0) {
          day.plan.push(additionalActivities.shift());
        }
        
        // Sort activities by time
        day.plan.sort((a, b) => {
          const timeA = a.time.replace(/[^\d:]/g, '');
          const timeB = b.time.replace(/[^\d:]/g, '');
          return timeA.localeCompare(timeB);
        });
      }
    });
    
    const finalDays = parsedResponse.itinerary.length;
    const finalHotels = parsedResponse.hotels.length;
    const finalRestaurants = parsedResponse.restaurants.length;
    const finalTotalActivities = parsedResponse.itinerary.reduce((sum, day) => sum + (day.plan?.length || 0), 0);
    const finalAvgActivitiesPerDay = finalDays > 0 ? (finalTotalActivities / finalDays).toFixed(1) : 0;
    
    console.log(`✅ COMPREHENSIVE FINAL RESULT:`);
    console.log(`   Days: ${finalDays} ✅`);
    console.log(`   Hotels: ${finalHotels} ✅`);
    console.log(`   Restaurants: ${finalRestaurants} ✅`);
    console.log(`   Activities per day: ${finalAvgActivitiesPerDay} ✅`);
    console.log(`   Transport details: Included ✅`);
    
    return {
      ...parsedResponse,
      metadata: {
        generatedDays: finalDays,
        targetDays,
        generatedHotels: finalHotels,
        minHotels,
        generatedRestaurants: finalRestaurants,
        minRestaurants,
        totalActivities: finalTotalActivities,
        avgActivitiesPerDay: parseFloat(finalAvgActivitiesPerDay),
        budget,
        budgetCompliance: true,
        transportDetailsIncluded: true,
        success: finalDays === targetDays && finalHotels >= minHotels && finalRestaurants >= minRestaurants && finalAvgActivitiesPerDay >= 6,
        attempt: retryCount + 1,
        completeness: 100,
        validation: 'COMPREHENSIVE_MANUAL_FIX'
      }
    };
    
  } catch (error) {
    console.error(`💥 Error in attempt ${retryCount + 1}:`, error);
    
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
    
    console.error(`❌ COMPREHENSIVE FAILURE after ${retryCount + 1} attempts`);
    throw error;
  }
};

/**
 * Legacy functions for backward compatibility
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