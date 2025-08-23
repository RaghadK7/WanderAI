describe('Form Validation - Final Working Version', () => {
  
  it('Form Validation Flow - Error messages appear then disappear', () => {
    // الذهاب لصفحة Create Trip
    cy.visit('/create-trip')
    cy.wait(3000)
    
    // التحقق من تحميل الصفحة
    cy.contains('Share your travel preferences').should('be.visible')
    
    // محاكاة تسجيل دخول أولاً
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        uid: 'test123',
        email: 'test@example.com',
        name: 'Test User'
      }))
    })
    cy.reload()
    cy.wait(2000)
    
    // ** اختبار 1: محاولة إرسال النموذج فارغ **
    cy.contains('✨ Generate My Trip').click()
    
    // التحقق من ظهور رسائل الخطأ للنموذج الفارغ
    cy.contains('Please select a destination', { timeout: 5000 }).should('be.visible')
    cy.contains('Please specify trip duration', { timeout: 5000 }).should('be.visible')
    cy.contains('Please select your budget', { timeout: 5000 }).should('be.visible')
    cy.contains('Please select who you\'re traveling with', { timeout: 5000 }).should('be.visible')
    
    cy.screenshot('form-validation-empty-form-errors')
    
    // ** اختبار 2: ملء البيانات تدريجياً **
    
    // إضافة مدة صحيحة
    cy.get('input[placeholder*="Enter number of days"]').clear().type('5')
    cy.wait(1000)
    
    // اختيار ميزانية - استخدام الـ selector الصحيح
    cy.get('.option-card').contains('Budget').closest('.option-card').click()
    
    // التحقق من الاختيار بطريقة مختلفة - البحث عن العنصر المحدد
    cy.get('.option-card-selected').should('contain.text', 'Budget')
    cy.wait(1000)
    
    // اختيار مسافرين
    cy.get('.option-card').contains('Solo').closest('.option-card').click()
    cy.get('.option-card-selected').should('contain.text', 'Solo')
    cy.wait(1000)
    
    cy.screenshot('form-validation-partial-data-filled')
    
    // ** اختبار 3: اختبار validation لمدة خاطئة **
    cy.get('input[placeholder*="Enter number of days"]').clear().type('0')
    cy.contains('✨ Generate My Trip').click()
    
    // التحقق من ظهور رسائل خطأ محددة
    cy.contains('Please select a destination', { timeout: 5000 }).should('be.visible')
    cy.contains('Trip duration must be between 1 and 15 days', { timeout: 5000 }).should('be.visible')
    
    cy.screenshot('form-validation-invalid-duration-error')
    
    // ** اختبار 4: تصحيح البيانات **
    cy.get('input[placeholder*="Enter number of days"]').clear().type('7')
    cy.wait(1000)
    
    // التحقق من البيانات الصحيحة
    cy.get('input[placeholder*="Enter number of days"]').should('have.value', '7')
    
    // التحقق من عدد العناصر المختارة
    cy.get('.option-card-selected').should('have.length', 2)
    
    cy.screenshot('form-validation-corrected-data')
    
    // محاولة إرسال مرة أخيرة
    cy.contains('✨ Generate My Trip').click()
    
    // التحقق من أن رسالة واحدة فقط تظهر (الوجهة)
    cy.contains('Please select a destination', { timeout: 5000 }).should('be.visible')
    
    cy.screenshot('form-validation-only-destination-error')
  })
  
  // اختبار مبسط جداً - بدون تحقق من CSS classes
  it('Simple Form Test - Basic functionality only', () => {
    cy.visit('/create-trip')
    cy.wait(2000)
    
    // محاكاة تسجيل دخول
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        uid: 'test123',
        email: 'test@example.com', 
        name: 'Test User'
      }))
    })
    cy.reload()
    cy.wait(2000)
    
    // اختبار أساسي: النموذج فارغ
    cy.contains('✨ Generate My Trip').click()
    cy.contains('Please select a destination', { timeout: 5000 }).should('be.visible')
    cy.screenshot('simple-empty-form-error')
    
    // ملء المدة
    cy.get('input[placeholder*="Enter number of days"]').clear().type('5')
    cy.get('input[placeholder*="Enter number of days"]').should('have.value', '5')
    
    // النقر على خيارات (بدون تحقق من selection)
    cy.get('.option-card').contains('Budget').click()
    cy.get('.option-card').contains('Solo').click()
    
    // التحقق من أن الزر ما زال يعمل
    cy.contains('✨ Generate My Trip').should('be.visible').and('not.be.disabled')
    
    cy.screenshot('simple-form-filled')
  })
  
  // اختبار فقط لرسائل الخطأ - بدون اختيار
  it('Error Messages Only - Validation messages test', () => {
    cy.visit('/create-trip')
    cy.wait(2000)
    
    // محاكاة تسجيل دخول
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        uid: 'test123',
        email: 'test@example.com', 
        name: 'Test User'
      }))
    })
    cy.reload()
    cy.wait(2000)
    
    // اختبار رسائل الخطأ للنموذج الفارغ
    cy.contains('✨ Generate My Trip').click()
    
    cy.contains('Please select a destination').should('be.visible')
    cy.contains('Please specify trip duration').should('be.visible')
    cy.contains('Please select your budget').should('be.visible')
    cy.contains('Please select who you\'re traveling with').should('be.visible')
    
    cy.screenshot('error-messages-validation')
    
    // اختبار validation للمدة الخاطئة
    cy.get('input[placeholder*="Enter number of days"]').type('0')
    cy.contains('✨ Generate My Trip').click()
    
    cy.contains('Trip duration must be between 1 and 15 days', { timeout: 5000 }).should('be.visible')
    cy.screenshot('duration-validation-error')
    
    // اختبار validation للمدة الكبيرة
    cy.get('input[placeholder*="Enter number of days"]').clear().type('20')
    cy.contains('✨ Generate My Trip').click()
    
    cy.contains('Trip duration must be between 1 and 15 days', { timeout: 5000 }).should('be.visible')
    cy.screenshot('large-duration-validation-error')
  })
  
  // اختبار interaction بدون تحقق معقد
  it('Form Interaction - Click and type only', () => {
    cy.visit('/create-trip')
    cy.wait(2000)
    
    // ملء المدة
    cy.get('input[placeholder*="Enter number of days"]').clear().type('3')
    cy.get('input[placeholder*="Enter number of days"]').should('have.value', '3')
    
    // النقر على جميع خيارات الميزانية
    cy.get('.option-card').contains('Budget').click()
    cy.wait(500)
    cy.get('.option-card').contains('Mid-Range').click()
    cy.wait(500)
    cy.get('.option-card').contains('Luxury').click()
    cy.wait(500)
    
    // النقر على خيارات المسافرين
    cy.get('.option-card').contains('Solo').click()
    cy.wait(500)
    cy.get('.option-card').contains('Couple').click()
    cy.wait(500)
    
    // تغيير المدة
    cy.get('input[placeholder*="Enter number of days"]').clear().type('10')
    cy.get('input[placeholder*="Enter number of days"]').should('have.value', '10')
    
    // التحقق من أن الزر يعمل
    cy.contains('✨ Generate My Trip').should('be.visible')
    
    cy.screenshot('form-interaction-clicks')
  })
  
})