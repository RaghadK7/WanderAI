const createTravelPrompt = (location, days, traveler, budget, attempt = 1) => {
  const targetDays = parseInt(days);
  
  // تحديد فئات الفنادق والأماكن حسب الميزانية
  const getBudgetConfig = (budget) => {
    switch(budget.toLowerCase()) {
      case 'budget':
        return {
          hotelCategories: ['Budget', 'Economy', 'Hostel'],
          priceRanges: {
            hotels: ['$20-40', '$30-50', '$40-60'],
            food: ['$5-15', '$10-20', '$15-25'],
            activities: ['Free', '$5-15', '$10-20']
          },
          recommendations: 'Focus on budget-friendly options, free attractions, local street food, public transport, hostels and budget hotels'
        };
      
      case 'mid-range':
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
        return getBudgetConfig('mid-range');
    }
  };
  
  const budgetConfig = getBudgetConfig(budget);
  
  return `Generate a travel plan for ${location} specifically tailored for ${budget.toUpperCase()} travelers.

CRITICAL REQUIREMENTS:
- Duration: EXACTLY ${targetDays} days
- Budget Category: ${budget.toUpperCase()}
- Traveler: ${traveler}
- Hotels: EXACTLY 3 hotels ALL in ${budget.toUpperCase()} category
- ${budgetConfig.recommendations}

BUDGET-SPECIFIC GUIDELINES:
${budget.toLowerCase() === 'budget' ? `
- Prioritize FREE attractions and activities
- Include budget restaurants, street food, local markets
- Suggest public transportation
- Focus on hostels, guesthouses, budget hotels
- Mention free walking tours, public parks, free museums
` : budget.toLowerCase() === 'luxury' ? `
- Include premium experiences and fine dining
- Suggest luxury hotels with spa/amenities
- Include private tours and exclusive experiences
- Recommend upscale restaurants and rooftop bars
- Consider private transportation options
` : `
- Balance between quality and value
- Mix of popular paid attractions and some free activities
- Comfortable mid-range accommodations
- Good local restaurants with reasonable prices
- Mix of public transport and occasional taxi/ride-share
`}

REQUIRED JSON STRUCTURE:
{
  "hotels": [
    {
      "id": "1",
      "hotelName": "Hotel Name 1",
      "hotelAddress": "Complete Address",
      "price": "${budgetConfig.priceRanges.hotels[0]} per night",
      "hotelImageUrl": "https://images.unsplash.com/hotel1",
      "geoCoordinates": "lat,lng",
      "rating": "4.0",
      "description": "${budgetConfig.hotelCategories[0]} hotel description",
      "category": "${budgetConfig.hotelCategories[0]}"
    },
    {
      "id": "2", 
      "hotelName": "Hotel Name 2",
      "hotelAddress": "Complete Address",
      "price": "${budgetConfig.priceRanges.hotels[1]} per night",
      "hotelImageUrl": "https://images.unsplash.com/hotel2",
      "geoCoordinates": "lat,lng",
      "rating": "3.8",
      "description": "${budgetConfig.hotelCategories[1]} hotel description",
      "category": "${budgetConfig.hotelCategories[1]}"
    },
    {
      "id": "3",
      "hotelName": "Hotel Name 3", 
      "hotelAddress": "Complete Address",
      "price": "${budgetConfig.priceRanges.hotels[2]} per night",
      "hotelImageUrl": "https://images.unsplash.com/hotel3",
      "geoCoordinates": "lat,lng",
      "rating": "3.5",
      "description": "${budgetConfig.hotelCategories[2]} hotel description",
      "category": "${budgetConfig.hotelCategories[2]}"
    }
  ],
  "itinerary": [
    ${Array.from({length: targetDays}, (_, i) => `{
      "day": "Day ${i + 1}",
      "plan": [
        {
          "time": "8:00 AM",
          "placeName": "${budget.toLowerCase() === 'budget' ? 'Local Breakfast Spot' : budget.toLowerCase() === 'luxury' ? 'Premium Restaurant' : 'Popular Breakfast Place'}",
          "placeDetails": "Breakfast recommendation suitable for ${budget} travelers",
          "placeImageUrl": "https://images.unsplash.com/breakfast",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.food[0]}",
          "timeToTravel": "15 minutes"
        },
        {
          "time": "9:30 AM",
          "placeName": "${budget.toLowerCase() === 'budget' ? 'Free Museum/Park' : budget.toLowerCase() === 'luxury' ? 'Premium Attraction' : 'Popular Tourist Site'}",
          "placeDetails": "Morning attraction suitable for ${budget} budget",
          "placeImageUrl": "https://images.unsplash.com/attraction1",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.activities[0]}",
          "timeToTravel": "20 minutes"
        },
        {
          "time": "12:00 PM",
          "placeName": "${budget.toLowerCase() === 'budget' ? 'Local Food Market' : budget.toLowerCase() === 'luxury' ? 'Fine Dining Restaurant' : 'Good Local Restaurant'}",
          "placeDetails": "Lunch option matching ${budget} preferences",
          "placeImageUrl": "https://images.unsplash.com/restaurant",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.food[1]}",
          "timeToTravel": "10 minutes"
        },
        {
          "time": "2:00 PM",
          "placeName": "Afternoon Activity",
          "placeDetails": "Activity suitable for ${budget} travelers",
          "placeImageUrl": "https://images.unsplash.com/activity",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "${budgetConfig.priceRanges.activities[1]}",
          "timeToTravel": "25 minutes"
        },
        {
          "time": "7:30 PM",
          "placeName": "${budget.toLowerCase() === 'budget' ? 'Street Food Area' : budget.toLowerCase() === 'luxury' ? 'Upscale Restaurant' : 'Popular Dinner Spot'}",
          "placeDetails": "Dinner recommendation for ${budget} budget",
          "placeImageUrl": "https://images.unsplash.com/dinner",
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
- Must have exactly ${targetDays} days and exactly 3 hotels`;
};

// تحديث دالة إضافة الفنادق المفقودة
const fixMissingHotels = (parsedResponse, location, budget) => {
  const budgetConfig = getBudgetConfig(budget);
  
  if (parsedResponse.hotels.length < 3) {
    const missingCount = 3 - parsedResponse.hotels.length;
    
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
};