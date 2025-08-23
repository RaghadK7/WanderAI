  const validateForm = (formData) => {
    const errors = [];
    if (!formData?.location) errors.push('Please select a destination');
    if (!formData?.noOfDays) errors.push('Please specify trip duration');
    if (!formData?.budget) errors.push('Please select your budget');
    if (!formData?.traveler) errors.push('Please select who you\'re traveling with');
    
    const days = parseInt(formData?.noOfDays);
    if (days < 1 || days > 15) errors.push('Trip duration must be between 1 and 15 days');
    
    return errors;
  };
module.exports = validateForm;