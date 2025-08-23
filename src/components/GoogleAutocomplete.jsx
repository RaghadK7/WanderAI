import React, { useEffect, useRef, useState } from "react";

const GoogleAutocomplete = ({ onPlaceSelected }) => {
  const inputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [service, setService] = useState(null);

  useEffect(() => {
    if (window.google?.maps?.places?.AutocompleteSuggestion) {
      const autocompleteService = new window.google.maps.places.AutocompleteSuggestion();
      setService(autocompleteService);
    } else {
      console.warn("AutocompleteSuggestion API not available.");
    }
  }, []);

  const handleInputChange = (e) => {
    const input = e.target.value;
    if (service && input.length > 2) {
      service.getSuggestions({ input }, (predictions, status) => {
        if (status === "OK" && predictions?.length > 0) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      });
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (suggestion) => {
    inputRef.current.value = suggestion.description;
    setSuggestions([]);
    onPlaceSelected(suggestion);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter a location"
        className="w-full px-3 py-1.5 bg-white text-gray-500 border border-[#c6d7d8] outline-none focus:ring-1 focus:ring-[#3f95c4] transition-[border] duration-300"
        onChange={handleInputChange}
      />
      {suggestions.length > 0 && (
        <ul className="absolute w-full z-50 bg-white border border-gray-300 mt-1 max-h-60 overflow-y-auto shadow-lg rounded">
          {suggestions.map((sug, i) => (
            <li
              key={i}
              onClick={() => handleSelect(sug)}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
            >
              {sug.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GoogleAutocomplete;
