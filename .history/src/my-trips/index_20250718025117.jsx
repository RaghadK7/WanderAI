import React, { useEffect } from 'react'

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