// src/create-trip/service/tripService.js

export async function generateTravelPlan(formData) {
  const response = await fetch("/api/generate-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!response.ok) throw new Error("Failed to generate travel plan");
  return response.json();
}

export async function saveTrip(trip) {
  const response = await fetch("/api/save-trip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
  });

  if (!response.ok) throw new Error("Failed to save trip");
  return response.json();
}

export async function fetchGoogleProfile() {
  const response = await fetch("/api/google/profile");
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}
