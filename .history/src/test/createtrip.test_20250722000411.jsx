import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTrip from '@/components/create-trip'; // استخدام الـ alias

// نعمل mocks للمكتبات الخارجية لتفادي الأخطاء أو طلبات الشبكة
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  }
}));

// مسار مُصحح من src/test إلى src/service
jest.mock('@/service/AIModal', () => ({
  generateTravelPlan: jest.fn(() => Promise.resolve({
    itinerary: [{}, {}, {}] // تعطي 3 أيام رحلة كمثال
  })),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
}));

describe('CreateTrip Component', () => {

  test('renders form elements', () => {
    render(<CreateTrip />);
    
    expect(screen.getByText(/Share your travel preferences/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Where would you like to go/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter number of days/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget Preference/i)).toBeInTheDocument();
    expect(screen.getByText(/Travel Companions/i)).toBeInTheDocument();
  });

  test('user can select budget and enter days', () => {
    render(<CreateTrip />);

    const budgetOption = screen.getByText(/Budget-Friendly/i);
    fireEvent.click(budgetOption);
    expect(budgetOption.closest('.option-card-selected')).toBeTruthy();

    const inputDays = screen.getByPlaceholderText(/Enter number of days/i);
    fireEvent.change(inputDays, { target: { value: '5' } });
    expect(inputDays.value).toBe('5');
  });

  test('generate trip triggers loading and AI call', async () => {
    render(<CreateTrip />);

    // ضبط بيانات النموذج
    fireEvent.click(screen.getByText(/Budget-Friendly/i));
    fireEvent.click(screen.getByText(/Solo Traveler/i));
    fireEvent.change(screen.getByPlaceholderText(/Enter number of days/i), { target: { value: '3' } });

    // الضغط على الزر
    fireEvent.click(screen.getByRole('button', { name: /Generate My Trip/i }));

    // يظهر تحميل
    expect(screen.getByText(/Creating Your Dream Trip/i)).toBeInTheDocument();

    // ننتظر انتهاء العملية
    await waitFor(() => expect(screen.queryByText(/Creating Your Dream Trip/i)).not.toBeInTheDocument());
  });

});