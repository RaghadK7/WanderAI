// src/components/__tests__/CreateTrip.edgecases.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateTrip from '../CreateTrip';
import { generateTravelPlan } from '@/service/AIModal';
import { toast } from 'sonner';

// Mock جميع الخدمات
jest.mock('@/service/AIModal');
jest.mock('sonner');
jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => jest.fn()
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn()
}));
jest.mock('react-google-places-autocomplete', () => {
  return function MockGooglePlacesAutocomplete({ selectProps }) {
    return (
      <input
        data-testid="places-input"
        placeholder={selectProps.placeholder}
        onChange={(e) => selectProps.onChange({ label: e.target.value })}
      />
    );
  };
});

describe('CreateTrip API Edge Cases', () => {
  beforeEach(() => {
    // إعداد المستخدم المسجل
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify({ email: 'test@example.com', name: 'Test User' });
      }
      return null;
    });
    
    jest.clearAllMocks();
  });

  describe('Network and Timeout Scenarios', () => {
    test('should handle network timeout', async () => {
      // محاكاة انتهاء مهلة الشبكة
      generateTravelPlan.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Trip generation failed');
      });
    });

    test('should handle slow API response', async () => {
      // محاكاة استجابة بطيئة
      const slowResponse = new Promise(resolve => 
        setTimeout(() => resolve({
          itinerary: [{ day: 1, plan: [] }]
        }), 2000)
      );
      
      generateTravelPlan.mockReturnValue(slowResponse);
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // التحقق من ظهور حالة التحميل
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      });
    }, 10000);

    test('should handle intermittent connection issues', async () => {
      // محاكاة مشاكل الاتصال المتقطعة
      let callCount = 0;
      generateTravelPlan.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Connection lost'));
        }
        return Promise.resolve({ itinerary: [{ day: 1, plan: [] }] });
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Trip generation failed');
      });
    });
  });

  describe('API Response Validation', () => {
    test('should handle malformed JSON response', async () => {
      generateTravelPlan.mockResolvedValue("invalid json string");
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid AI response');
      });
    });

    test('should handle response with missing required fields', async () => {
      generateTravelPlan.mockResolvedValue({
        // مفقود itinerary
        hotels: []
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid AI response');
      });
    });

    test('should handle response with empty itinerary', async () => {
      generateTravelPlan.mockResolvedValue({
        itinerary: [],
        hotels: []
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('No itinerary generated');
      });
    });

    test('should handle response with corrupted data', async () => {
      generateTravelPlan.mockResolvedValue({
        itinerary: [
          { day: null, plan: undefined },
          { day: "invalid", plan: "not an array" }
        ]
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // يجب أن يتعامل مع البيانات التالفة بشكل أنيق
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      });
    });
  });

  describe('Rate Limiting and API Quotas', () => {
    test('should handle API rate limit exceeded', async () => {
      generateTravelPlan.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded'
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Trip generation failed');
      });
    });

    test('should handle API quota exceeded', async () => {
      generateTravelPlan.mockRejectedValue({
        status: 403,
        message: 'Quota exceeded'
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Trip generation failed');
      });
    });
  });

  describe('Data Persistence Edge Cases', () => {
    test('should handle localStorage full error', async () => {
      generateTravelPlan.mockResolvedValue({
        itinerary: [{ day: 1, plan: [] }]
      });
      
      // محاكاة امتلاء localStorage
      localStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      });
      
      // يجب أن يستمر العمل حتى لو فشل localStorage
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('🎉 Trip saved successfully!');
      });
    });

    test('should handle concurrent save operations', async () => {
      generateTravelPlan.mockResolvedValue({
        itinerary: [{ day: 1, plan: [] }]
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      const button = screen.getByText('✨ Generate My Trip');
      
      // محاولة النقر عدة مرات بسرعة
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // يجب استدعاء API مرة واحدة فقط
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Authentication Edge Cases', () => {
    test('should handle expired Google token', async () => {
      localStorage.getItem.mockReturnValue(null); // لا يوجد مستخدم
      
      // محاكاة token منتهي الصلاحية
      global.fetch.mockRejectedValueOnce({
        status: 401,
        message: 'Token expired'
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // يجب ظهور نافذة تسجيل الدخول
      await waitFor(() => {
        expect(screen.getByText('Sign In With Google')).toBeInTheDocument();
      });
    });

    test('should handle invalid user session', async () => {
      // محاكاة بيانات مستخدم تالفة
      localStorage.getItem.mockReturnValue('invalid json');
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // يجب طلب تسجيل الدخول مرة أخرى
      await waitFor(() => {
        expect(screen.getByText('Sign In With Google')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation Edge Cases', () => {
    test('should handle invalid trip duration', async () => {
      render(<CreateTrip />);
      
      // ملء النموذج بقيم غير صحيحة
      const placesInput = screen.getByTestId('places-input');
      fireEvent.change(placesInput, { target: { value: 'Paris' } });
      
      const daysInput = screen.getByPlaceholderText('Enter number of days');
      await userEvent.clear(daysInput);
      await userEvent.type(daysInput, '20'); // أكثر من الحد المسموح
      
      // اختيار الميزانية والرفاق
      fireEvent.click(screen.getByText('Budget-Friendly'));
      fireEvent.click(screen.getByText('Solo'));
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // يجب ظهور رسالة خطأ التحقق
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Trip duration must be between 1 and 15 days');
      });
      
      // لا يجب استدعاء API
      expect(generateTravelPlan).not.toHaveBeenCalled();
    });

    test('should handle missing form fields', async () => {
      render(<CreateTrip />);
      
      // ملء جزء من النموذج فقط
      const placesInput = screen.getByTestId('places-input');
      fireEvent.change(placesInput, { target: { value: 'Paris' } });
      
      // ترك باقي الحقول فارغة
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // يجب ظهور رسائل خطأ متعددة
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please specify trip duration');
      });
      
      expect(generateTravelPlan).not.toHaveBeenCalled();
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    test('should handle localStorage not available', async () => {
      // محاكاة عدم توفر localStorage
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      
      generateTravelPlan.mockResolvedValue({
        itinerary: [{ day: 1, plan: [] }]
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // يجب أن يطلب تسجيل الدخول
      await waitFor(() => {
        expect(screen.getByText('Sign In With Google')).toBeInTheDocument();
      });
      
      // استعادة localStorage
      global.localStorage = originalLocalStorage;
    });

    test('should handle fetch not available', async () => {
      // محاكاة عدم توفر fetch
      const originalFetch = global.fetch;
      delete global.fetch;
      
      localStorage.getItem.mockReturnValue(null);
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      // يجب ظهور نافذة تسجيل الدخول
      await waitFor(() => {
        expect(screen.getByText('Sign In With Google')).toBeInTheDocument();
      });
      
      // استعادة fetch
      global.fetch = originalFetch;
    });
  });

  describe('Performance Edge Cases', () => {
    test('should handle rapid user interactions', async () => {
      generateTravelPlan.mockResolvedValue({
        itinerary: [{ day: 1, plan: [] }]
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      const button = screen.getByText('✨ Generate My Trip');
      
      // محاولة النقر بسرعة عالية
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
        fireEvent.click(button);
      }
      
      // يجب استدعاء API مرة واحدة فقط أو حسب حالة التحميل
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalledTimes(1);
      });
    });

    test('should handle large response data', async () => {
      // محاكاة استجابة كبيرة الحجم
      const largeItinerary = Array.from({ length: 15 }, (_, i) => ({
        day: i + 1,
        plan: Array.from({ length: 10 }, (_, j) => ({
          placeName: `Place ${i}-${j}`,
          placeDetails: 'A'.repeat(1000), // نص طويل
          ticketPricing: `$${j * 10}`,
          timeTravel: `${j + 1} hours`
        }))
      }));
      
      generateTravelPlan.mockResolvedValue({
        itinerary: largeItinerary
      });
      
      render(<CreateTrip />);
      await fillForm();
      
      fireEvent.click(screen.getByText('✨ Generate My Trip'));
      
      await waitFor(() => {
        expect(generateTravelPlan).toHaveBeenCalled();
      });
      
      // يجب التعامل مع البيانات الكبيرة بنجاح
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  // دالة مساعدة لملء النموذج
  async function fillForm() {
    // اختيار الوجهة
    const placesInput = screen.getByTestId('places-input');
    fireEvent.change(placesInput, { target: { value: 'Paris, France' } });
    
    // إدخال عدد الأيام
    const daysInput = screen.getByPlaceholderText('Enter number of days');
    await userEvent.clear(daysInput);
    await userEvent.type(daysInput, '3');
    
    // اختيار الميزانية
    const budgetOption = screen.getByText('Budget-Friendly');
    fireEvent.click(budgetOption);
    
    // اختيار نوع السفر
    const travelerOption = screen.getByText('Solo');
    fireEvent.click(travelerOption);
    
    // انتظار قصير للتأكد من تحديث الحالة
    await waitFor(() => {
      expect(placesInput.value).toBe('Paris, France');
    });
  }

  // دالة مساعدة للتحقق من حالة النموذج
  function expectFormToBeValid() {
    expect(screen.getByTestId('places-input')).toHaveValue('Paris, France');
    expect(screen.getByPlaceholderText('Enter number of days')).toHaveValue('3');
    expect(screen.getByText('Budget-Friendly')).toHaveClass('option-card-selected');
    expect(screen.getByText('Solo')).toHaveClass('option-card-selected');
  }

  // دالة مساعدة للتحقق من حالة التحميل
  function expectLoadingState() {
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('✨ Generate My Trip')).toBeDisabled();
  }
});