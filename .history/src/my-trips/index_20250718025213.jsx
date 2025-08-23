import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


function MyTrips() {

     useEffect(() => {
      GetUserTrips();

  }, [])

  const GetUserTrips=()=>{ 
   const user=localStorage.getItem('user');
   const navigation=useNavigate();
   if(!user)
    {
      navigation('/');
    }
   
  }
 
  return (
    <div>MyTrips</div>
  )
}

export default MyTrips