

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateTrip from './CreateTrip'; // Adjust the path if needed
import '@testing-library/jest-dom';

describe('Budget Selection Tests', () => {
  test('renders all budget options', () => {
    render(<CreateTrip />);
    
    // Check that some budget options are visible (replace texts with your actual options)
    expect(screen.getByText(/Budget-Friendly/i)).toBeInTheDocument();
    expect(screen.getByText(/Luxury/i)).toBeInTheDocument();
  });

  test('selecting a budget option updates the UI', () => {
    render(<CreateTrip />);

    // Find a budget option (example: "Budget-Friendly")
    const budgetOption = screen.getByText(/Budget-Friendly/i);

    // Click the option
    fireEvent.click(budgetOption);

    // Expect the clicked option to have the 'option-card-selected' class
    expect(budgetOption.closest('.option-card')).toHaveClass('option-card-selected');
  });
});
