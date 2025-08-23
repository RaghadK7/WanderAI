import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

const config = {
  temperature: 0.4,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const createPrompt = (location, days, traveler, budget) => {
  return `Create travel plan for ${location}. Generate EXACTLY ${days} days, no exceptions.

Requirements:
- Traveler: ${traveler}, Budget: ${budget}
- Generate ${days} hotels minimum
-AT Least 4 Hotels Recommendation
- Each day: 4-5 activities with times
- All ${days} days must be included

JSON format:
{
  "hotels": [
    {"hotelName": "Name", "hotelAddress": "Address", "price": "$XX/night", "hotelImageUrl": "url", "geoCoordinates": "lat,lng", "rating": "X.X", "description": "text"}
  ],
  "itinerary": [
    {"day": "Day 1", "plan": [{"time": "9:00 AM", "placeName": "Name", "placeDetails": "Details", "placeImageUrl": "url", "geoCoordinates": "lat,lng", "ticketPricing": "$XX", "timeToTravel": "XX mins"}]}
  ]
}

Generate all ${days} days now:`;
};

