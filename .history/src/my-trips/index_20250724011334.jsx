/**
 * MyTrips Component - User Trip Dashboard
 * 
 * Features:
 * - Displays all user trips from Firebase
 * - Supports both Google and Email/Password authenticated users
 * - Shows real destination photos
 * - Handles empty states gracefully
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { db } from '@/service/firebaseConfig';
import { GetPlaceDetails } from '@/service/GlobalApi';
import { toast } from 'sonner';

// Google Places API photo URL template
const PHOTO_REF_URL =
  'https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=1200&maxWidthPx=1200&key=' +
  import.meta.env.VITE_GOOGLE_PLACE_API_KEY;

/**
 * Main MyTrips Component
 */
function MyTrips() {
  const [userTrips, setUserTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load user trips on component mount
   */
  useEffect(() => {
    GetUserTrips();
  }, [])

  /**
   * Enhanced GetUserTrips function
   * Supports both Google and Email/Password authentication
   * Queries by both email and userId for maximum compatibility
   */
  const GetUserTrips = async () => { 
    const userData = localStorage.getItem('user');
    
    // Redirect to home if user not authenticated
    if (!userData) {
      window.location.href = '/';
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUserTrips([]); // Reset trips array
      setLoading(true);
      
      // Create queries for both email and userId
      // This ensures compatibility with both old (Google-only) and new (Email/Password) data
      const emailQuery = query(
        collection(db, "AITrips"), 
        where("userEmail", "==", user.email)
      );
      
      // Query by userId (for newer authentication method)
      let userIdQuery = null;
      if (user.uid) {
        userIdQuery = query(
          collection(db, "AITrips"),
          where("userId", "==", user.uid)
        );
      }
      
      // Execute queries
      const queries = [getDocs(emailQuery)];
      if (userIdQuery) {
        queries.push(getDocs(userIdQuery));
      }
      
      const queryResults = await Promise.all(queries);
      
      // Combine results and remove duplicates using Map
      const tripsMap = new Map();
      
      queryResults.forEach(querySnapshot => {
        querySnapshot.forEach((doc) => {
          console.log('Found trip:', doc.id, " => ", doc.data());
          // Use document ID as key to prevent duplicates
          tripsMap.set(doc.id, {
            id: doc.id,
            ...doc.data()
          });
        });
      });
      
      // Convert to array and sort by creation date (newest first)
      const trips = Array.from(tripsMap.values()).sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Newest first
      });
      
      setUserTrips(trips);
      console.log(`✅ Found ${trips.length} trips for user:`, user.email);
      
    } catch (error) {
      console.error("Error getting trips:", error);
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Individual Trip Card Component
   * Displays trip information with real destination photos
   */
  const UserTripCardItem = ({ trip }) => {
    const [photoUrl, setPhotoUrl] = useState();
    const [imageLoading, setImageLoading] = useState(true);
    
    /**
     * Load destination photo when trip data is available
     */
    useEffect(() => {
      if (trip?.userSelection?.location?.label) {
        GetPlacePhoto();
      }
    }, [trip]);

    /**
     * Fetches real photo for trip destination
     * Uses Google Places API to get authentic location images
     */
    const GetPlacePhoto = async () => {
      try {
        const data = { textQuery: trip.userSelection.location.label };
        const result = await GetPlaceDetails(data);
        const photos = result?.data?.places?.[0]?.photos;

        if (photos?.length > 0) {
          const photoName = photos[0].name;
          const url = PHOTO_REF_URL.replace('{NAME}', photoName);
          setPhotoUrl(url);
          console.log('✅ Real image loaded for:', trip.userSelection?.location?.label);
        } else {
          console.warn('No photos found for destination:', trip.userSelection.location.label);
        }
      } catch (error) {
        console.error('Error fetching place photo:', error);
      } finally {
        setImageLoading(false);
      }
    };

    /**
     * Formats creation date for display
     */
    const formatDate = (dateString) => {
      if (!dateString) return 'Recently';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch {
        return 'Recently';
      }
    };

    return (
      <div 
        className="group bg-white border border-sky-100 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden"
        onClick={() => {
          console.log('Clicked trip with ID:', trip.id);
          window.location.href = `/view-trip/${trip.id}`;
        }}
      >
        <div className="flex flex-col gap-4">
          
          {/* Trip Destination Image */}
          <div className="relative overflow-hidden rounded-xl">
            {imageLoading && (
              <div className="w-full h-48 bg-gray-200 animate-pulse rounded-xl flex items-center justify-center">
                <span className="text-gray-400">Loading image...</span>
              </div>
            )}
            <img
              src={photoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop'}
              alt={`${trip.userSelection?.location?.label || 'Trip'} destination`}
              className={`w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300 ${imageLoading ? 'hidden' : 'block'}`}
              onLoad={() => setImageLoading(false)}
              onError={(e) => {
                console.log('❌ Image failed, using fallback for:', trip.userSelection?.location?.label);
                e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop';
                setImageLoading(false);
              }}
            />
            {/* Hover overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Creation date badge */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
              {formatDate(trip.createdAt)}
            </div>
          </div>
          
          {/* Trip Information */}
          <div className="space-y-3">
            {/* Destination Name */}
            <h3 className="font-bold text-xl text-gray-800 group-hover:text-sky-700 transition-colors leading-tight">
              {trip.userSelection?.location?.label || 'Unknown Destination'}
            </h3>
            
            {/* Trip Details Grid */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              {/* Duration */}
              <div className='flex items-center gap-1 px-2 py-1 bg-sky-50 rounded-full'>
                <span className="text-sky-500">📅</span>
                <span className='font-medium text-sky-700'>
                  {trip.userSelection?.noOfDays || 'N/A'} days
                </span>
              </div>
              
              {/* Budget */}
              <div className='flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full'>
                <span className="text-green-500">💰</span>
                <span className='font-medium text-green-700 text-xs'>
                  {trip.userSelection?.budget || 'N/A'}
                </span>
              </div>
              
              {/* Travel Companions */}
              <div className='flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full'>
                <span className="text-purple-500">👥</span>
                <span className='font-medium text-purple-700 text-xs'>
                  {trip.userSelection?.traveler || 'N/A'}
                </span>
              </div>
            </div>
            
            {/* View Details Button */}
            <button className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg">
              View Trip Details
            </button>
          </div>
        </div>
      </div>
    )
  };

  /**
   * Loading State Component
   */
  const LoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-lg">
          <div className="animate-pulse">
            {/* Image skeleton */}
            <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
            
            {/* Title skeleton */}
            <div className="h-6 bg-gray-200 rounded mb-3"></div>
            
            {/* Details skeleton */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="h-8 bg-gray-200 rounded-full"></div>
              <div className="h-8 bg-gray-200 rounded-full"></div>
              <div className="h-8 bg-gray-200 rounded-full"></div>
            </div>
            
            {/* Button skeleton */}
            <div className="h-12 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * Empty State Component
   * Shown when user has no trips yet
   */
  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="text-6xl mb-6">🧳</div>
      <h3 className="text-2xl font-semibold text-gray-800 mb-3">No trips yet</h3>
      <p className="text-gray-600 mb-8">Start planning your dream vacation today!</p>
      <button 
        onClick={() => window.location.href = '/create-trip'}
        className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
      >
        Create Your First Trip
      </button>
    </div>
  );
 
  // Main component render
  return (
    <div className='p-10 md:px-20 lg:px-36'>
      
      {/* Page Header */}
      <div className="text-center mb-10">
        <h2 className='font-bold text-4xl text-cyan-500 mb-2'>
          My Trips
        </h2>
        <p className="text-gray-600 text-lg">
          Your personalized travel experiences
        </p>
      </div>
      
      {/* Content Area */}
      {loading ? (
        // Show loading skeletons while fetching data
        <LoadingState />
      ) : userTrips.length === 0 ? (
        // Show empty state when no trips found
        <EmptyState />
      ) : (
        // Show trips grid when data is available
        <>
          {/* Trip Count Info */}
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              {userTrips.length === 1 
                ? "You have 1 amazing trip planned" 
                : `You have ${userTrips.length} amazing trips planned`}
            </p>
          </div>
          
          {/* Trips Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {userTrips.map((trip, index) => (
              <UserTripCardItem key={trip.id || index} trip={trip} />
            ))}
          </div>
          
          {/* Add New Trip Button */}
          <div className="text-center mt-12">
            <button 
              onClick={() => window.location.href = '/create-trip'}
              className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <span className="text-xl">+</span>
              Plan Another Trip
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default MyTrips