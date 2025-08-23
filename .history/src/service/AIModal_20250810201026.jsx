import React, { useState } from 'react';
import { chatSession } from '@/service/AIModal';
import { toast } from 'sonner';

const AITravelGenerator = ({ prompt, onItineraryGenerated }) => {
  const [loading, setLoading] = useState(false);

  // تنظيف الرد
  const cleanJSON = (text) => {
    try {
      let cleaned = text
        .trim()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) {
        throw new Error('No valid JSON found in AI response');
      }

      return JSON.parse(cleaned.substring(start, end + 1));
    } catch (error) {
      console.error('❌ JSON Cleaning Error:', error);
      throw error;
    }
  };

  // المحاولة مع أكثر من مودل
  const tryAllModels = async (prompt) => {
    const models = ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4o']; // غير الترتيب أو ضيف مودلز
    for (let model of models) {
      try {
        console.log(`🚀 Trying model: ${model}`);
        const response = await chatSession(prompt, model);
        if (response && response.trim()) {
          return response;
        }
      } catch (err) {
        console.warn(`⚠️ Model ${model} failed, trying next...`);
      }
    }
    throw new Error('All models failed to generate a valid response');
  };

  // التوليد
  const generateTravelPlan = async () => {
    setLoading(true);
    try {
      const aiResponse = await tryAllModels(prompt);
      const parsed = cleanJSON(aiResponse);

      if (!parsed.itinerary || parsed.itinerary.length === 0) {
        toast.error('AI did not return a valid itinerary.');
        return;
      }

      console.log(`✅ SUCCESS: Generated ${parsed.itinerary.length} days`);
      onItineraryGenerated(parsed.itinerary);
    } catch (error) {
      console.error('🔥 Generation failed:', error);
      toast.error('Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        disabled={loading}
        onClick={generateTravelPlan}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? 'Generating...' : 'Generate Trip'}
      </button>
    </div>
  );
};

export default AITravelGenerator;
