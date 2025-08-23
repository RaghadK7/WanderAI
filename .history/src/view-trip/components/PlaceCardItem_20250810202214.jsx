import React, { useEffect, useState } from 'react';
import { FaMapLocationDot } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import { GetPlaceDetails } from '@/service/GlobalApi';

// Google Places photo URL
const PHOTO_REF_URL = 'https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=1200&maxWidthPx=1200&key=' + import.meta.env.VITE_GOOGLE_PLACE_API_KEY;

function PlaceCardItem({ place }) {
  const [photoUrl, setPhotoUrl] = useState();
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);

  useEffect(() => {
    if (place?.placeName) GetPlacePhoto();
  }, [place]);

  // Fetch place photo from Google Places API
  const GetPlacePhoto = async () => {
    if (!place?.placeName) return;
    
    setIsLoadingPhoto(true);
    try {
      const result = await GetPlaceDetails({ textQuery: place.placeName });
      const photos = result?.data?.places?.[0]?.photos;
      
      if (photos?.length > 0) {
        const PhotoUrl = PHOTO_REF_URL.replace('{NAME}', photos[0].name);
        setPhotoUrl(PhotoUrl);
      }
    } catch (error) {
      console.error('Error fetching place photo:', error);
    } finally {
      setIsLoadingPhoto(false);
    }
  };

  // Return error state if no place data
  if (!place) {
    return (
      <div className="h-full bg-gray-100 border border-gray-200 rounded-xl p-4 flex items-center justify-center">
        <p className="text-gray-500 text-sm">No place data available</p>
      </div>
    );
  }

  return (
    <Link to={`https://www.google.com/maps/search/?api=1&query=${place.placeName || ''}`} target='_blank' className="block h-full">
      <div className="h-full bg-white border border-sky-100 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col">
        
        {/* Image Section - Fixed Height */}
        <div className="relative overflow-hidden rounded-lg mb-3 h-32 flex-shrink-0">
          {isLoadingPhoto ? (
            <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">Loading...</span>
            </div>
          ) : (
            <img
              src={photoUrl || "https://via.placeholder.com/300x128/e0f2fe/0891b2?text=No+Image"}
              alt={place.placeName}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              onError={(e) => e.target.src = "https://via.placeholder.com/300x128/e0f2fe/0891b2?text=No+Image"}
            />
          )}
        </div>
        
        {/* Content Section - Flexible Height */}
        <div className="flex-1 flex flex-col">
          {/* Title - Fixed Height */}
          <h3 className="font-bold text-sm text-gray-800 hover:text-sky-700 transition-colors mb-2 line-clamp-2 h-10 leading-5">
            {place.placeName || 'Place name not available'}
          </h3>
          
          {/* Description - Flexible Height */}
          <p className='text-xs text-gray-600 mb-3 line-clamp-3 flex-1'>
            {place.placeDetails || 'No description available'}
          </p>
          
          {/* Footer - Fixed Height */}
          <div className="flex items-center justify-between mt-auto">
            <div className='flex items-center gap-1 px-2 py-1 bg-sky-50 rounded-full'>
              <span className="text-sky-500 text-xs">⏱️</span>
              <span className='text-xs font-medium text-sky-700'>
                {place.timeToTravel || 'Not specified'}
              </span>
            </div>
            
            <button className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 p-1.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110">
              <FaMapLocationDot className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PlaceCardItem;