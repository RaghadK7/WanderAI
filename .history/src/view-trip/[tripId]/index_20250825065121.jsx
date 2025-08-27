import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { db } from '@/service/firebaseConfig';
import { use } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import InfoSection from '../components/InfoSection';
import Hotels from '../components/Hotels';
import PlacesToVisit from '../components/PlacesToVisit';

function ViewTrip() {
  const{ tripId } = useParams();
  const[tripData, setTriP] = useState([]);
  
  
  useEffect(() => {
    tripId&&GetTripData();
  },[tripId])

  
  const GetTripData=async() => {
    const docRef=doc(db, 'AITrips', tripId);
    const docSnap=await getDoc(docRef);
    

    if(docSnap.exists()) {
      console.log("Document data:", docSnap.data());
      setTriP(docSnap.data());
    }
    else {
      console.log("No such Document!");
      toast("Trip not found")
      
    }
  }
  return (
    <div className='p-10 md:px-20 lg:px-44 xl:px-56'>
      {/* Information section*/}
      <InfoSection  trip={tripData}/>
      {/* Recommended hotels */}
      <Hotels trip={tripData}/>
      {/* Daily plan*/}
      <PlacesToVisit trip={tripData}/>
    </div>
  )
}

export default ViewTrip