const createTravelPrompt = (location, days, traveler, budget) => {
  return `You are a travel expert.

Generate a detailed **travel plan** for:
- Location: ${location}
- Duration: EXACTLY ${days} Days
- Traveler: ${traveler}
- Budget: ${budget}

⚠️ STRICT INSTRUCTIONS ⚠️
- Do NOT generate more or less than ${days} days. Must be EXACT.
- Use this exact structure: "Day 1", "Day 2", ..., up to "Day ${days}".
- Each day must include **3 to 6 different activities or places**, each with a specific time slot.
- Include exact travel times between each location.
- Mention **best visiting time** for each place.

Return ONLY this JSON response:

{
  "hotels": [
    {
      "hotelName": "Hotel Name",
      "hotelAddress": "Full Address",
      "price": "Price Range",
      "hotelImageUrl": "Image URL",
      "geoCoordinates": "lat,lng",
      "rating": "Rating out of 5",
      "description": "Brief description"
    }
    // Add at least 5 different hotel options
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "plan": [
        {
          "time": "e.g. 09:00 AM",
          "placeName": "Place Name",
          "placeDetails": "Short description",
          "placeImageUrl": "Image URL",
          "geoCoordinates": "lat,lng",
          "ticketPricing": "Price or Free",
          "timeToTravel": "e.g. 20 mins"
        }
        // 3 to 6 entries per day
      ]
    }
    // Repeat for ALL ${days} days exactly
  ]
}

No explanations. No introductions. No summaries. Only return the JSON response above, and make sure "itinerary" contains exactly ${days} entries.`;
};
