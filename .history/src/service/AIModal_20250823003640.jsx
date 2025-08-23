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

          // ✅ Log which model generated the travel plan
          console.log(`🎉 Travel plan generated successfully using model: ${modelName}`);

          return parsed;
        }
      } catch (error) {
        console.warn(`❌ Model ${modelName} failed, trying next one...`);
      }
    }

    console.error("🔥 All models failed - returning fallback plan");
    return {
      hotels: [],
      itinerary: []
    };

  } catch (error) {
    console.error("🔥 Generation error:", error);
    return { hotels: [], itinerary: [] };
  }
};
