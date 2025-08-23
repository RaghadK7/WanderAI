export const generateTravelPlan = async (destination, days, travelers, budget) => {
  const prompt = `
You are an intelligent travel assistant.

Your task is to create a detailed travel plan for the destination: ${destination}.
Trip duration: ${days} days.
Number of travelers: ${travelers}.
Total budget: ${budget} SAR.

Break down the trip into a daily itinerary.

For each day, include:
- A short day title.
- 3 activities or places to visit.
- 1 recommended restaurant (preferably local or unique).
- If the budget is limited, suggest free or low-cost options.
- Avoid repeating activities and ensure variety.

At the end, add a general travel tip.
Respond in clear, friendly English in a helpful tone.

Start now.
`;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const result = await response.json();
  return result?.choices?.[0]?.message?.content || "Something went wrong generating the travel plan.";
};
