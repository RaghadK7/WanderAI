import React, { useEffect, useState } from 'react';
import { db } from '@/service/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import UserTripCardItem from "../components/UserTripCardItem";

function MyTrips() {
  const [userTrips, setUserTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetUserTrips();
  }, []);

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
  );
}

export default MyTrips;
