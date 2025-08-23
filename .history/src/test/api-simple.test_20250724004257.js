// src/__tests__/api.test.js
import { generateTravelPlan } from '@/service/AIModal';

// Mock الدالة
jest.mock('@/service/AIModal');

describe('API Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // اختبار 1: API ناجح
  test('should call AI API successfully', async () => {
    // ترتيب - تحديد النتيجة المتوقعة
    const mockResponse = {
      itinerary: [
        { day: 1, plan: [{ placeName: "Eiffel Tower" }] },
        { day: 2, plan: [{ placeName: "Louvre" }] }
      ]
    };
    
    generateTravelPlan.mockResolvedValue(mockResponse);
    
    // تنفيذ - استدعاء API
    const result = await generateTravelPlan('Paris', 2, 'Solo', 'Budget');
    
    // تحقق - التأكد من النتائج
    expect(generateTravelPlan).toHaveBeenCalledWith('Paris', 2, 'Solo', 'Budget');
    expect(result).toEqual(mockResponse);
    expect(result.itinerary).toHaveLength(2);
  });

  // اختبار 2: API فاشل
  test('should handle API failure', async () => {
    // ترتيب - محاكاة فشل
    generateTravelPlan.mockRejectedValue(new Error('API Error'));
    
    // تنفيذ وتحقق
    await expect(generateTravelPlan('Paris', 2, 'Solo', 'Budget'))
      .rejects
      .toThrow('API Error');
    
    expect(generateTravelPlan).toHaveBeenCalledTimes(1);
  });

  // اختبار 3: استجابة فارغة
  test('should handle empty response', async () => {
    // ترتيب
    generateTravelPlan.mockResolvedValue(null);
    
    // تنفيذ
    const result = await generateTravelPlan('Paris', 2, 'Solo', 'Budget');
    
    // تحقق
    expect(result).toBeNull();
    expect(generateTravelPlan).toHaveBeenCalled();
  });

  // اختبار 4: معاملات مختلفة
  test('should work with different parameters', async () => {
    const mockResponse = { itinerary: [{ day: 1, plan: [] }] };
    generateTravelPlan.mockResolvedValue(mockResponse);
    
    // اختبار معاملات مختلفة
    await generateTravelPlan('Dubai', 5, 'Family', 'Luxury');
    
    expect(generateTravelPlan).toHaveBeenCalledWith('Dubai', 5, 'Family', 'Luxury');
  });

  // اختبار 5: timeout
  test('should handle timeout', async () => {
    // محاكاة timeout
    generateTravelPlan.mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );
    
    await expect(generateTravelPlan('Paris', 2, 'Solo', 'Budget'))
      .rejects
      .toThrow('Timeout');
  });
});