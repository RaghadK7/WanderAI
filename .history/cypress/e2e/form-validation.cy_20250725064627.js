describe('Form Validation Flow Test - Create Trip Page', () => {
  
  it('Form Validation Flow - Error messages appear then disappear', () => {
    // الذهاب لصفحة Create Trip
    cy.visit('/create-trip')
    cy.wait(3000)
    
    // التحقق من تحميل الصفحة
    cy.contains('Share your travel preferences').should('be.visible')
    
    // محاكاة تسجيل دخول أولاً لتجنب مربع تسجيل الدخول
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
    
    // ** اختبار 2: ملء البيانات تدريجياً ومشاهدة اختفاء الأخطاء **
    
    // إضافة مدة صحيحة
    cy.get('input[placeholder*="Enter number of days"]').clear().type('5')
    cy.wait(1000)
    
    // اختيار ميزانية
    cy.get('.option-card').contains('Budget').click()
    cy.get('.option-card').contains('Budget').should('have.class', 'option-card-selected')
    cy.wait(1000)
    
    // اختيار مسافرين
    cy.get('.option-card').contains('Solo').click()
    cy.get('.option-card').contains('Solo').should('have.class', 'option-card-selected')
    cy.wait(1000)
    
    cy.screenshot('form-validation-partial-data-filled')
    
    // ** اختبار 3: اختبار validation لمدة خاطئة **
    cy.get('input[placeholder*="Enter number of days"]').clear().type('0')
    cy.contains('✨ Generate My Trip').click()
    
    // التحقق من ظهور رسائل خطأ محددة
    cy.contains('Please select a destination', { timeout: 5000 }).should('be.visible')
    cy.contains('Trip duration must be between 1 and 15 days', { timeout: 5000 }).should('be.visible')
    
    cy.screenshot('form-validation-invalid-duration-error')
    
    // ** اختبار 4: اختبار مدة كبيرة **
    cy.get('input[placeholder*="Enter number of days"]').clear().type('20')
    cy.contains('✨ Generate My Trip').click()
    
    cy.contains('Trip duration must be between 1 and 15 days', { timeout: 5000 }).should('be.visible')
    
    cy.screenshot('form-validation-large-duration-error')
    
    // ** اختبار 5: تصحيح البيانات ومشاهدة اختفاء الأخطاء **
    cy.get('input[placeholder*="Enter number of days"]').clear().type('7')
    cy.wait(1000)
    
    // التحقق من أن البيانات صحيحة الآن (عدا الوجهة)
    cy.get('input[placeholder*="Enter number of days"]').should('have.value', '7')
    cy.get('.option-card-selected').should('have.length', 2) // Budget + Solo
    
    // محاولة إرسال مرة أخيرة (سيفشل فقط بسبب الوجهة)
    cy.contains('✨ Generate My Trip').click()
    
    // التحقق من أن رسالة واحدة فقط تظهر (الوجهة)
    cy.contains('Please select a destination', { timeout: 5000 }).should('be.visible')
    
    // التحقق من عدم ظهور رسائل أخرى
    cy.get('body').should('not.contain.text', 'Please specify trip duration')
    cy.get('body').should('not.contain.text', 'Please select your budget')
    cy.get('body').should('not.contain.text', 'Please select who you\'re traveling with')
    
    cy.screenshot('form-validation-only-destination-error')
    
    // ** اختبار 6: التحقق من حالة النموذج النهائية **
    
    // التحقق من أن جميع العناصر المملوءة ما زالت صحيحة
    cy.get('input[placeholder*="Enter number of days"]').should('have.value', '7')
    cy.get('.option-card').contains('Budget').should('have.class', 'option-card-selected')
    cy.get('.option-card').contains('Solo').should('have.class', 'option-card-selected')
    
    // التحقق من أن الزر ما زال يعمل
    cy.contains('✨ Generate My Trip').should('be.visible').and('not.be.disabled')
    
    cy.screenshot('form-validation-final-state')
  })
  
  // اختبار إضافي: تفاعل المستخدم مع النموذج
  it('Form Interaction - User experience validation', () => {
    cy.visit('/create-trip')
    cy.wait(2000)
    
    // اختبار تفاعل المستخدم العادي
    
    // ملء المدة أولاً
    cy.get('input[placeholder*="Enter number of days"]').type('3')
    cy.get('input[placeholder*="Enter number of days"]').should('have.value', '3')
    
    // اختيار ميزانية Mid-Range
    cy.get('.option-card').contains('Mid-Range').click()
    cy.get('.option-card').contains('Mid-Range').should('have.class', 'option-card-selected')
    
    // تغيير الرأي واختيار Luxury
    cy.get('.option-card').contains('Luxury').click()
    cy.get('.option-card').contains('Luxury').should('have.class', 'option-card-selected')
    cy.get('.option-card').contains('Mid-Range').should('not.have.class', 'option-card-selected')
    
    // اختيار Couple
    cy.get('.option-card').contains('Couple').click()
    cy.get('.option-card').contains('Couple').should('have.class', 'option-card-selected')
    
    // تغيير المدة
    cy.get('input[placeholder*="Enter number of days"]').clear().type('10')
    cy.get('input[placeholder*="Enter number of days"]').should('have.value', '10')
    
    // التحقق من الحالة النهائية
    cy.get('.option-card-selected').should('have.length', 2) // Luxury + Couple
    
    cy.screenshot('form-interaction-user-experience')
  })
  
})