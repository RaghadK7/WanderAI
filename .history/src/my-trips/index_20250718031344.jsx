import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect } from 'react'
import { db } from '@/service/firebaseConfig';
import { use } from 'react';

function MyTrips() {
  const [userTrips,setUserTrips]=useState([]);
  useEffect(() => {
    GetUserTrips();
  }, [])
  /**
   * 
   * @returns used to get the trips of the user from the database
   */

  const GetUserTrips = async () => { 
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      window.location.href = '/';
      return;
    }

    try {
      setUserTrips([]);
      const parsedUser = JSON.parse(user);
      const q = query(collection(db, "AITrips"), where("userEmail", "==", parsedUser.email));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        console.log(doc.id, " => ", doc.data());
      });
    } catch (error) {
      console.error("Error getting trips:", error);
      setUserTrips(preVal=>[...preval,doc.data()]);
    }
  }
 
  return (
    <div className='p-10 md:px-20 lg:px-36'>
      <h2></h2>
    </div>
  )
}

export default MyTrips