export const generateTravelPlan = async (location, days, traveler, budget) => {
  try {
    const prompt = createPrompt(location, days, traveler, budget);

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = await result.response.text();
        const match = text.match(/{[\s\S]*}/);

        if (match) {
          const parsed = JSON.parse(match[0]);

          // Ensure itinerary is always an array
          parsed.itinerary = Array.isArray(parsed.itinerary)
            ? parsed.itinerary
            : Object.values(parsed.itinerary || []);

          // ✅ Log which model successfully generated the travel plan
          console.log(`🎉 Travel plan generated using model: ${modelName}`);

          return parsed;
        }
      } catch {}
    }

    // Fallback if all models fail
    return {
      hotels: [{
        hotelName: "Generation Failed",
        hotelAddress: "Please try again",
        price: "N/A",
        hotelImageUrl: "",
        geoCoordinates: "0,0",
        rating: "0",
        description: "AI currently unavailable"
      }],
      itinerary: [{
        day: "Day 1",
        plan: [{
          time: "Error",
          placeName: "Generation Failed",
          placeDetails: "Please try again later",
          placeImageUrl: "",
          geoCoordinates: "0,0",
          ticketPricing: "N/A",
          timeToTravel: "N/A"
        }]
      }]
    };

  } catch (error) {
    console.error("🔥 Generation error:", error);
    return { hotels: [], itinerary: [] };
  }
};
