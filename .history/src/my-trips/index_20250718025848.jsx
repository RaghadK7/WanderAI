import { query } from 'firebase/firestore';
import React, { useEffect } from 'react'
import { c } from 'vite/dist/node/types.d-aGj9QkWt';


function MyTrips() {

     useEffect(() => {
      GetUserTrips();

  }, [])

  const GetUserTrips=()=>{ 
   const user=localStorage.getItem('user');
   
   if(!user)
    {
      window.location.href = '/';
    }

    const q=query(collection(db, "AITrips"), where("userId", "==", user));
   
  }
 
  return (
    <div>MyTrips</div>
  )
}

export default MyTrips