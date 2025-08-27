import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { db } from '@/service/firebaseConfig';
import { GetPlaceDetails } from '@/service/GlobalApi';
import { toast } from 'sonner';

const PHOTO_REF_URL = 'https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=1200&maxWidthPx=1200&key=' + import.meta.env.VITE_GOOGLE_PLACE_API_KEY;

function MyTrips() {
  const [userTrips, setUserTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetUserTrips();
  }, [])

  const GetUserTrips = async () => { 
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      window.location.href = '/';
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUserTrips([]);
      setLoading(true);
      
      const emailQuery = query(collection(db, "AITrips"), where("userEmail", "==", user.email));
      let userIdQuery = null;
      if (user.uid) {
        userIdQuery = query(collection(db, "AITrips"), where("userId", "==", user.uid));
      }
      
      const queries = [getDocs(emailQuery)];
      if (userIdQuery) queries.push(getDocs(userIdQuery));
      
      const queryResults = await Promise.all(queries);
      const tripsMap = new Map();
      
      queryResults.forEach((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          tripsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
      });
      
      const trips = Array.from(tripsMap.values()).sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      
      setUserTrips(trips);
      if (trips.length > 0) {
        toast.success(`Loaded ${trips.length} trip${trips.length > 1 ? 's' : ''}`);
      }
      
    } catch (error) {
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }

  const UserTripCardItem = ({ trip }) => {
    const [photoUrl, setPhotoUrl] = useState();
    const [imageLoading, setImageLoading] = useState(true);
    
    useEffect(() => {
      if (trip?.userSelection?.location?.label) {
        GetPlacePhoto();
      }
    }, [trip]);

    const GetPlacePhoto = async () => {
      try {
        const data = { textQuery: trip.userSelection.location.label };
        const result = await GetPlaceDetails(data);
        const photos = result?.data?.places?.[0]?.photos;

        if (photos?.length > 0) {
          const photoName = photos[0].name;
          setPhotoUrl(PHOTO_REF_URL.replace('{NAME}', photoName));
        }
      } catch (error) {
        console.error('Error fetching place photo:', error);
      } finally {
        setImageLoading(false);
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'Recently';
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
      } catch {
        return 'Recently';
      }
    };

    return (
      <div 
        className="group bg-white border border-sky-100 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden"
        onClick={() => window.location.href = `/view-trip/${trip.id}`}
      >
        <div className="flex flex-col gap-4">
          
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
                e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop';
                setImageLoading(false);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
              {formatDate(trip.createdAt)}
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-bold text-xl text-gray-800 group-hover:text-sky-700 transition-colors leading-tight">
              {trip.userSelection?.location?.label || 'Unknown Destination'}
            </h3>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className='flex items-center gap-1 px-2 py-1 bg-sky-50 rounded-full'>
                <span className="text-sky-500">📅</span>
                <span className='font-medium text-sky-700'>
                  {trip.userSelection?.noOfDays || 'N/A'} days
                </span>
              </div>
              
              <div className='flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full'>
                <span className="text-green-500">💰</span>
                <span className='font-medium text-green-700 text-xs'>
                  {trip.userSelection?.budget || 'N/A'}
                </span>
              </div>
              
              <div className='flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full'>
                <span className="text-purple-500">👥</span>
                <span className='font-medium text-purple-700 text-xs'>
                  {trip.userSelection?.traveler || 'N/A'}
                </span>
              </div>
            </div>
            
            <button className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg">
              View Trip Details
            </button>
          </div>
        </div>
      </div>
    )
  };

 import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { db } from '@/service/firebaseConfig';
import { GetPlaceDetails } from '@/service/GlobalApi';
import { toast } from 'sonner';

const PHOTO_REF_URL = 'https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=1200&maxWidthPx=1200&key=' + import.meta.env.VITE_GOOGLE_PLACE_API_KEY;

function MyTrips() {
  const [userTrips, setUserTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetUserTrips();
  }, [])

  const GetUserTrips = async () => { 
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      window.location.href = '/';
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUserTrips([]);
      setLoading(true);
      
      const emailQuery = query(collection(db, "AITrips"), where("userEmail", "==", user.email));
      let userIdQuery = null;
      if (user.uid) {
        userIdQuery = query(collection(db, "AITrips"), where("userId", "==", user.uid));
      }
      
      const queries = [getDocs(emailQuery)];
      if (userIdQuery) queries.push(getDocs(userIdQuery));
      
      const queryResults = await Promise.all(queries);
      const tripsMap = new Map();
      
      queryResults.forEach((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          tripsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
      });
      
      const trips = Array.from(tripsMap.values()).sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      
      setUserTrips(trips);
      if (trips.length > 0) {
        toast.success(`Loaded ${trips.length} trip${trips.length > 1 ? 's' : ''}`);
      }
      
    } catch (error) {
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }

  const UserTripCardItem = ({ trip }) => {
    const [photoUrl, setPhotoUrl] = useState();
    const [imageLoading, setImageLoading] = useState(true);
    
    useEffect(() => {
      if (trip?.userSelection?.location?.label) {
        GetPlacePhoto();
      }
    }, [trip]);

    const GetPlacePhoto = async () => {
      try {
        const data = { textQuery: trip.userSelection.location.label };
        const result = await GetPlaceDetails(data);
        const photos = result?.data?.places?.[0]?.photos;

        if (photos?.length > 0) {
          const photoName = photos[0].name;
          setPhotoUrl(PHOTO_REF_URL.replace('{NAME}', photoName));
        }
      } catch (error) {
        console.error('Error fetching place photo:', error);
      } finally {
        setImageLoading(false);
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'Recently';
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
      } catch {
        return 'Recently';
      }
    };

    return (
      <div 
        className="group bg-white border border-sky-100 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden"
        onClick={() => window.location.href = `/view-trip/${trip.id}`}
      >
        <div className="flex flex-col gap-4">
          
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
                e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop';
                setImageLoading(false);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
              {formatDate(trip.createdAt)}
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-bold text-xl text-gray-800 group-hover:text-sky-700 transition-colors leading-tight">
              {trip.userSelection?.location?.label || 'Unknown Destination'}
            </h3>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className='flex items-center gap-1 px-2 py-1 bg-sky-50 rounded-full'>
                <span className="text-sky-500">📅</span>
                <span className='font-medium text-sky-700'>
                  {trip.userSelection?.noOfDays || 'N/A'} days
                </span>
              </div>
              
              <div className='flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full'>
                <span className="text-green-500">💰</span>
                <span className='font-medium text-green-700 text-xs'>
                  {trip.userSelection?.budget || 'N/A'}
                </span>
              </div>
              
              <div className='flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full'>
                <span className="text-purple-500">👥</span>
                <span className='font-medium text-purple-700 text-xs'>
                  {trip.userSelection?.traveler || 'N/A'}
                </span>
              </div>
            </div>
            
            <button className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg">
              View Trip Details
            </button>
          </div>
        </div>
      </div>
    )
  };

  const LoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-lg">
          <div className="animate-pulse">
            <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-3"></div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="h-8 bg-gray-200 rounded-full"></div>
              <div className="h-8 bg-gray-200 rounded-full"></div>
              <div className="h-8 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );

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
 
  return (
    <div className='p-10 md:px-20 lg:px-36'>
      
      <div className="text-center mb-10">
        <h2 className='font-bold text-4xl text-cyan-500 mb-2'>My Trips</h2>
        <p className="text-gray-600 text-lg">Your personalized travel experiences</p>
      </div>
      
      {loading ? (
        <LoadingState />
      ) : userTrips.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              {userTrips.length === 1 
                ? "You have 1 amazing trip planned" 
                : `You have ${userTrips.length} amazing trips planned`}
            </p>
          </div>
          
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {userTrips.map((trip, index) => (
              <UserTripCardItem key={trip.id || index} trip={trip} />
            ))}
          </div>
          
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
 
  return (
    <div className='p-10 md:px-20 lg:px-36'>
      
      <div className="text-center mb-10">
        <h2 className='font-bold text-4xl text-cyan-500 mb-2'>My Trips</h2>
        <p className="text-gray-600 text-lg">Your personalized travel experiences</p>
      </div>
      
      {loading ? (
        <LoadingState />
      ) : userTrips.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              {userTrips.length === 1 
                ? "You have 1 amazing trip planned" 
                : `You have ${userTrips.length} amazing trips planned`}
            </p>
          </div>
          
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {userTrips.map((trip, index) => (
              <UserTripCardItem key={trip.id || index} trip={trip} />
            ))}
          </div>
          
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