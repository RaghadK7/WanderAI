 const renderOptionCards = (options, selectedValue, fieldName, cardType) => {
    return options.map((item, index) => (
      <div
        key={item.title || item.people}
        onClick={() => handleInputChange(fieldName, item.title || item.people)}
        className={`option-card option-card-hover option-card-${cardType} ${
          selectedValue === (item.title || item.people) ? 'option-card-selected' : 'option-card-unselected'
        }`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        {/* Icon */}
        <div className={`${cardType === 'budget' ? 'icon-container' : 'icon-container-travelers'} ${
          selectedValue === (item.title || item.people) ? 'icon-container-selected' : 'icon-container-unselected'
        }`}>
          <span className={cardType === 'budget' ? "text-4xl" : "text-3xl"}>
            {item.icon}
          </span>
        </div>
        
    
