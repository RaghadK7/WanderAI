// BudgetSelector.jsx
import React, { useState } from 'react';

const BudgetSelector = () => {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div>
      {SelectBudgetOptions.map(option => (
        <div
          key={option.id}
          className={`option-card ${selectedId === option.id ? 'option-card-selected' : ''}`}
          onClick={() => setSelectedId(option.id)}
        >
          <h3>{option.title}</h3>
          <p>{option.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default BudgetSelector;
