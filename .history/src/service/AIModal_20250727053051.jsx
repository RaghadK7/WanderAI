import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.9,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

export const chatSession = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [
        {text: "You are a professional travel planner. Create detailed travel plans with EXACTLY the number of days requested. Include transportation times between locations, multiple activities per day, and comprehensive itineraries."},
      ],
    },
    {
      role: "model",
      parts: [
        {text: "I understand. I will create detailed travel plans with exactly the requested number of days, including transportation details, multiple activities per day, and comprehensive itineraries in JSON format."},
      ],
    },
  ],
});

export const generateTravelPlan = async (destination, days, travelers, budget) => {
  // تحسين الـ prompt ليكون أكثر تفصيلاً ووضوحاً
  const prompt = `
Create a comprehensive travel plan for ${destination} for EXACTLY ${days} days for ${travelers} with a ${budget} budget.

IMPORTANT REQUIREMENTS:
1. Generate EXACTLY ${days} days - no more, no less
2. Include 4-6 activities per day (morning, afternoon, evening)
3. Add transportation time and method between each location
4. Include various activity types: sightseeing, culture, food, entertainment, shopping
5. Provide realistic timing and costs
6. Include walking times and distances between nearby attractions

Please return a JSON object with this EXACT structure:
{
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Complete address",
      "price": "$XX-$XX per night",
      "hotelImageUrl": "https://example.com/image.jpg",
      "geoCoordinates": "latitude, longitude",
      "rating": "X.X stars",
      "description": "Detailed description with amenities"
    }
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "date": "Day 1 of ${days}",
      "theme": "Arrival & City Introduction",
      "plan": [
        {
          "time": "9:00 AM - 11:00 AM",
          "placeName": "Attraction Name",
          "placeDetails": "Detailed description of the place and what to expect",
          "placeImageUrl": "https://example.com/image.jpg",
          "geoCoordinates": "latitude, longitude",
          "ticketPricing": "$XX or Free",
          "rating": "X.X",
          "timeToTravel": "30 minutes by metro",
          "transportationMode": "Metro/Bus/Walking/Taxi",
          "distanceFromPrevious": "2.5 km",
          "bestTimeToVisit": "Morning/Afternoon/Evening",
          "estimatedDuration": "2 hours",
          "activityType": "Sightseeing/Culture/Food/Entertainment"
        }
      ]
    }
  ]
}

Make sure to:
- Include breakfast, lunch, and dinner recommendations
- Add rest periods and travel time
- Suggest local transportation options
- Include both popular and hidden gem locations
- Provide budget-friendly alternatives for expensive activities
- Consider the traveler type (${travelers}) in activity selection
- Generate content for ALL ${days} days without exception
`;

  try {
    console.log('🚀 Generating travel plan for:', { destination, days, travelers, budget });
    console.log('📝 Using enhanced prompt for better results...');
    
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 AI Response received:', text);
    
    // تنظيف النص بشكل أفضل
    let cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```/g, '')
      .replace(/^[^{]*{/, '{')  // إزالة أي نص قبل أول {
      .replace(/}[^}]*$/, '}')  // إزالة أي نص بعد آخر }
      .trim();
    
    console.log('🧹 Cleaned text:', cleanText.substring(0, 200) + '...');
    
    try {
      const parsedResult = JSON.parse(cleanText);
      
      // التحقق من صحة البيانات
      const validation = validateTravelPlan(parsedResult, days);
      if (!validation.isValid) {
        console.warn('⚠️ Validation issues:', validation.issues);
        // إذا كان هناك مشاكل، نحاول إصلاحها
        const fixedResult = fixTravelPlan(parsedResult, destination, days, travelers, budget);
        return fixedResult;
      }
      
      console.log('✅ Successfully generated and validated travel plan');
      return parsedResult;
      
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.log('Raw response:', text);
      // إرجاع بيانات احتياطية محسنة
      return generateEnhancedFallbackData(destination, days, travelers, budget);
    }
    
  } catch (error) {
    console.error("❌ Error generating travel plan:", error);
    // إرجاع بيانات احتياطية محسنة
    return generateEnhancedFallbackData(destination, days, travelers, budget);
  }
};

// دالة للتحقق من صحة خطة السفر
const validateTravelPlan = (plan, expectedDays) => {
  const issues = [];
  
  if (!plan || typeof plan !== 'object') {
    issues.push('Invalid plan structure');
    return { isValid: false, issues };
  }
  
  if (!Array.isArray(plan.hotels) || plan.hotels.length === 0) {
    issues.push('Missing or empty hotels array');
  }
  
  if (!Array.isArray(plan.itinerary)) {
    issues.push('Missing itinerary array');
    return { isValid: false, issues };
  }
  
  const actualDays = plan.itinerary.length;
  const requestedDays = parseInt(expectedDays);
  
  if (actualDays !== requestedDays) {
    issues.push(`Expected ${requestedDays} days, got ${actualDays} days`);
  }
  
  // التحقق من أن كل يوم له أنشطة
  plan.itinerary.forEach((day, index) => {
    if (!Array.isArray(day.plan) || day.plan.length < 3) {
      issues.push(`Day ${index + 1} has insufficient activities (minimum 3 required)`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// دالة لإصلاح خطة السفر
const fixTravelPlan = (plan, destination, days, travelers, budget) => {
  const requestedDays = parseInt(days);
  const currentDays = plan.itinerary ? plan.itinerary.length : 0;
  
  // إصلاح الفنادق إذا كانت مفقودة
  if (!plan.hotels || plan.hotels.length === 0) {
    plan.hotels = generateDefaultHotels(destination, budget);
  }
  
  // إصلاح عدد الأيام
  if (currentDays < requestedDays) {
    // إضافة أيام مفقودة
    for (let i = currentDays; i < requestedDays; i++) {
      plan.itinerary.push(generateDefaultDay(i + 1, destination, travelers));
    }
  } else if (currentDays > requestedDays) {
    // إزالة أيام زائدة
    plan.itinerary = plan.itinerary.slice(0, requestedDays);
  }
  
  // إصلاح الأيام التي لديها أنشطة قليلة
  plan.itinerary.forEach((day, index) => {
    if (!day.plan || day.plan.length < 3) {
      day.plan = generateDefaultActivities(index + 1, destination);
    }
  });
  
  return plan;
};

// دالة لإنشاء فنادق افتراضية
const generateDefaultHotels = (destination, budget) => {
  const budgetRanges = {
    'Cheap': '$40-$80',
    'Moderate': '$80-$150',
    'Luxury': '$150-$300'
  };
  
  return [
    {
      hotelName: `Best Western ${destination}`,
      hotelAddress: `123 Main Street, ${destination}`,
      price: budgetRanges[budget] || '$80-$150',
      hotelImageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500",
      geoCoordinates: "0.0000, 0.0000",
      rating: "4.2 stars",
      description: `Modern hotel in the heart of ${destination} with excellent amenities including free WiFi, pool, and fitness center.`
    },
    {
      hotelName: `${destination} Plaza Hotel`,
      hotelAddress: `456 Central Avenue, ${destination}`,
      price: budgetRanges[budget] || '$80-$150',
      hotelImageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500",
      geoCoordinates: "0.0000, 0.0000",
      rating: "4.0 stars",
      description: `Comfortable accommodation with great location and friendly staff. Perfect base for exploring ${destination}.`
    }
  ];
};

// دالة لإنشاء يوم افتراضي
const generateDefaultDay = (dayNumber, destination, travelers) => {
  const themes = [
    "City Exploration", "Cultural Discovery", "Local Cuisine", "Adventure Day", 
    "Relaxation", "Shopping & Entertainment", "Historical Sites", "Nature & Parks",
    "Art & Museums", "Local Markets", "Scenic Views", "Traditional Experiences",
    "Modern Attractions", "Food Tour", "Day Trip"
  ];
  
  return {
    day: `Day ${dayNumber}`,
    date: `Day ${dayNumber} of itinerary`,
    theme: themes[(dayNumber - 1) % themes.length],
    plan: generateDefaultActivities(dayNumber, destination, travelers)
  };
};

// دالة لإنشاء أنشطة افتراضية
const generateDefaultActivities = (dayNumber, destination, travelers = "Couple") => {
  const activities = [
    {
      time: "8:00 AM - 9:30 AM",
      placeName: `Local Breakfast Spot ${dayNumber}`,
      placeDetails: `Start your day with authentic local breakfast in ${destination}. Try traditional dishes and fresh coffee.`,
      placeImageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
      geoCoordinates: "0.0000, 0.0000",
      ticketPricing: "$15-25",
      rating: "4.3",
      timeToTravel: "5 minutes walking",
      transportationMode: "Walking",
      distanceFromPrevious: "0.2 km",
      bestTimeToVisit: "Morning",
      estimatedDuration: "1.5 hours",
      activityType: "Food"
    },
    {
      time: "10:00 AM - 12:30 PM",
      placeName: `Main Attraction ${dayNumber}`,
      placeDetails: `Explore one of ${destination}'s most famous landmarks. Perfect for ${travelers.toLowerCase()} with plenty of photo opportunities.`,
      placeImageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400",
      geoCoordinates: "0.0000, 0.0000",
      ticketPricing: "$20-35",
      rating: "4.5",
      timeToTravel: "25 minutes by metro",
      transportationMode: "Metro",
      distanceFromPrevious: "3.5 km",
      bestTimeToVisit: "Morning",
      estimatedDuration: "2.5 hours",
      activityType: "Sightseeing"
    },
    {
      time: "1:00 PM - 2:30 PM",
      placeName: `Traditional Restaurant ${dayNumber}`,
      placeDetails: `Enjoy lunch at a highly-rated local restaurant featuring regional specialties and authentic atmosphere.`,
      placeImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
      geoCoordinates: "0.0000, 0.0000",
      ticketPricing: "$25-40",
      rating: "4.4",
      timeToTravel: "10 minutes walking",
      transportationMode: "Walking",
      distanceFromPrevious: "0.8 km",
      bestTimeToVisit: "Afternoon",
      estimatedDuration: "1.5 hours",
      activityType: "Food"
    },
    {
      time: "3:00 PM - 5:30 PM",
      placeName: `Cultural Site ${dayNumber}`,
      placeDetails: `Discover the rich history and culture of ${destination} at this important cultural landmark.`,
      placeImageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400",
      geoCoordinates: "0.0000, 0.0000",
      ticketPricing: "$15-25",
      rating: "4.2",
      timeToTravel: "20 minutes by bus",
      transportationMode: "Bus",
      distanceFromPrevious: "2.8 km",
      bestTimeToVisit: "Afternoon",
      estimatedDuration: "2.5 hours",
      activityType: "Culture"
    },
    {
      time: "6:00 PM - 7:30 PM",
      placeName: `Scenic Viewpoint ${dayNumber}`,
      placeDetails: `Watch the sunset from this beautiful viewpoint overlooking ${destination}. Perfect for romantic moments.`,
      placeImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
      geoCoordinates: "0.0000, 0.0000",
      ticketPricing: "Free",
      rating: "4.6",
      timeToTravel: "15 minutes walking",
      transportationMode: "Walking",
      distanceFromPrevious: "1.2 km",
      bestTimeToVisit: "Evening",
      estimatedDuration: "1.5 hours",
      activityType: "Sightseeing"
    },
    {
      time: "8:00 PM - 10:00 PM",
      placeName: `Evening Entertainment ${dayNumber}`,
      placeDetails: `End your day with entertainment - live music, local shows, or vibrant nightlife in ${destination}.`,
      placeImageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
      geoCoordinates: "0.0000, 0.0000",
      ticketPricing: "$30-50",
      rating: "4.3",
      timeToTravel: "30 minutes by taxi",
      transportationMode: "Taxi",
      distanceFromPrevious: "4.0 km",
      bestTimeToVisit: "Evening",
      estimatedDuration: "2 hours",
      activityType: "Entertainment"
    }
  ];
  
  return activities;
};

// دالة محسنة للبيانات الاحتياطية
const generateEnhancedFallbackData = (destination, days, travelers, budget) => {
  console.log('🔄 Generating enhanced fallback data...');
  
  const requestedDays = parseInt(days);
  
  return {
    hotels: generateDefaultHotels(destination, budget),
    itinerary: Array.from({ length: requestedDays }, (_, index) => 
      generateDefaultDay(index + 1, destination, travelers)
    )
  };
};