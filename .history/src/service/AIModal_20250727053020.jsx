// إضافة هذه التحسينات لدالة OnGenerateTrip في CreateTrip.jsx

const OnGenerateTrip = async () => {
  // Check if user is authenticated
  const user = localStorage.getItem('user');
  if (!user) {
    setOpenDialog(true);
    return;
  }

  // Validate form inputs
  const errors = validateForm();
  if (errors.length > 0) {
    errors.forEach((error, index) => 
      setTimeout(() => toast.error(error), index * 500)
    );
    return;
  }

  // Start loading and prepare data
  setLoading(true);
  setLoadingMessage('Creating Your Dream Trip');
  setLoadingSubMessage('Our AI is crafting the perfect itinerary...');
  
  const requestedDays = parseInt(formData?.noOfDays);
  const destination = formData?.location?.label;

  try {
    // تحديث رسالة التحميل
    setLoadingSubMessage(`Generating ${requestedDays} days of amazing experiences...`);
    
    // Call AI service to generate travel plan
    const result = await generateTravelPlan(
      destination, requestedDays, formData?.traveler, formData?.budget
    );

    console.log('Generated result:', result);

    // معالجة محسنة للنتائج
    if (result && result.itinerary && Array.isArray(result.itinerary)) {
      const generatedDays = result.itinerary.length;
      
      // التحقق من جودة البيانات
      const hasValidDays = result.itinerary.every(day => 
        day.plan && Array.isArray(day.plan) && day.plan.length >= 3
      );
      
      if (generatedDays === requestedDays && hasValidDays) {
        toast.success(`🎉 Perfect! Complete ${requestedDays}-day itinerary created with ${result.itinerary.reduce((total, day) => total + day.plan.length, 0)} activities!`);
        setLoadingMessage('Saving Your Perfect Trip');
        setLoadingSubMessage('Almost done...');
      } else if (generatedDays === requestedDays) {
        toast.success(`✅ Generated ${requestedDays}-day itinerary successfully!`);
        setLoadingMessage('Saving Your Trip');
      } else if (generatedDays > 0) {
        toast.warning(`⚠️ Generated ${generatedDays} out of ${requestedDays} days. You can still proceed!`);
        setLoadingMessage('Saving Available Days');
      } else {
        toast.error('❌ Failed to generate proper itinerary');
        setLoading(false);
        return;
      }

      // التحقق من وجود فنادق
      if (!result.hotels || result.hotels.length === 0) {
        toast.warning('⚠️ Hotel recommendations may be limited');
      }

      // حفظ الرحلة مع البيانات المحسنة
      const enhancedResult = {
        ...result,
        metadata: {
          generatedAt: new Date().toISOString(),
          requestedDays: requestedDays,
          actualDays: generatedDays,
          destination: destination,
          travelers: formData?.traveler,
          budget: formData?.budget,
          totalActivities: result.itinerary.reduce((total, day) => total + (day.plan ? day.plan.length : 0), 0)
        }
      };

      setTimeout(() => saveTrip(enhancedResult), 1500);
      
    } else {
      console.error('Invalid result structure:', result);
      toast.error('❌ Generated trip data is invalid. Please try again.');
      setLoading(false);
    }
    
  } catch (error) {
    console.error('Trip generation error:', error);
    
    // رسائل خطأ أكثر تفصيلاً
    if (error.message && error.message.includes('quota')) {
      toast.error('🚫 AI service quota exceeded. Please try again later.');
    } else if (error.message && error.message.includes('network')) {
      toast.error('🌐 Network error. Please check your connection.');
    } else {
      toast.error('❌ Trip generation failed. Please try again.');
    }
    
    setLoading(false);
  } finally {
    // تنظيف رسائل التحميل
    setTimeout(() => {
      setLoadingMessage('');
      setLoadingSubMessage('');
    }, 2000);
  }
};

// تحسين دالة الحفظ أيضاً
const saveTrip = async (tripDataObj) => {
  const userData = localStorage.getItem('user');
  if (!userData) {
    toast.error('User not authenticated');
    setLoading(false);
    return;
  }

  const user = JSON.parse(userData);
  const docId = Date.now().toString();
  
  try {
    setLoadingMessage('Saving Your Adventure');
    setLoadingSubMessage('Creating your personalized travel guide...');
    
    // Create enhanced trip document
    const tripDocument = {
      userEmail: user.email,
      userId: user.uid,
      userSelection: formData,
      tripData: tripDataObj,
      id: docId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      version: '2.0', // نسخة محسنة
      metadata: {
        generatedDays: tripDataObj.itinerary?.length || 0,
        totalActivities: tripDataObj.itinerary?.reduce((total, day) => total + (day.plan?.length || 0), 0) || 0,
        hasHotels: (tripDataObj.hotels?.length || 0) > 0,
        destination: formData?.location?.label,
        travelers: formData?.traveler,
        budget: formData?.budget
      }
    };

    // Save to Firebase Firestore
    await setDoc(doc(db, 'AITrips', docId), tripDocument);
    
    // Save to localStorage as backup with compression
    const backupData = {
      userSelection: formData,
      tripData: tripDataObj,
      id: docId,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('AITrip_' + docId, JSON.stringify(backupData));
    
    setLoadingMessage('Success! 🎉');
    setLoadingSubMessage('Redirecting to your amazing trip...');
    
    toast.success('🎉 Your dream trip has been created and saved!');
    
    // انتظار لإظهار رسالة النجاح
    setTimeout(() => {
      setLoading(false);
      window.location.href = `/view-trip/${docId}`;
    }, 2000);
    
  } catch (error) {
    console.error("Error saving trip:", error);
    setLoading(false);
    
    // رسائل خطأ مفصلة
    if (error.code === 'permission-denied') {
      toast.error('❌ Permission denied. Please login again.');
    } else if (error.code === 'network-request-failed') {
      toast.error('🌐 Network error. Trip saved locally only.');
      // حفظ محلي في حالة فشل الشبكة
      localStorage.setItem('AITrip_' + docId, JSON.stringify({
        userSelection: formData,
        tripData: tripDataObj,
        id: docId,
        savedLocally: true,
        savedAt: new Date().toISOString()
      }));
      setTimeout(() => window.location.href = `/view-trip/${docId}`, 1000);
    } else {
      toast.error('❌ Failed to save trip. Please try again.');
    }
  }
};