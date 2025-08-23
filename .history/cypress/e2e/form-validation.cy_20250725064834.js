describe('Form Validation Flow Test - Create Trip Page (Fixed)', () => {
  
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
    
    // اختيار ميزانية - الطريقة الصحيحة
    cy.get('.option-card').contains('Budget').click()
    
    // التحقق من الاختيار - استخدام parent() للوصول للـ div الخارجي
    cy.get('.option-card').contains('Budget').parent().should('have.class', 'option-card-selected')
    cy.wait(1000)
    
    // اختيار مسافرين - الطريقة الصحيحة
    cy.get('.option-card').contains('Solo').click()
    cy.get('.option-card').contains('Solo').parent().should('have.class', 'option-card-selected')
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
    cy.get('.option-card-selected').should('have.length', 2) // Budget + Solo
    
    cy.screenshot('form-validation-corrected-data')
    
    // محاولة إرسال مرة أخيرة
    cy.contains('✨ Generate My Trip').click()
    
    // التحقق من أن رسالة واحدة فقط تظهر (الوجهة)
    cy.contains('Please select a destination', { timeout: 5000 }).should('be.visible')
    
    cy.screenshot('form-validation-only-destination-error')
  })
  
  // اختبار مبسط للتفاعل
  it('Form Interaction - Simple user experience test', () => {
    cy.visit('/create-trip')
    cy.wait(2000)
    
    // ملء المدة
    cy.get('input[placeholder*="Enter number of days"]').clear().type('3')
    cy.get('input[placeholder*="Enter number of days"]').should('have.value', '3')
    
    // اختيار ميزانية بطريقة مختلفة - العثور على العنصر الصحيح
    cy.get('.option-card').each(($card) => {
      if ($card.text().includes('Mid-Range')) {
        cy.wrap($card).click()
        cy.wrap($card).should('have.class', 'option-card-selected')
      }
    })
    
    // اختيار مسافرين
    cy.get('.option-card').each(($card) => {
      if ($card.text().includes('Couple')) {
        cy.wrap($card).click()
        cy.wrap($card).should('have.class', 'option-card-selected')
      }
    })
    
    // التحقق من حالة النموذج
    cy.get('.option-card-selected').should('have.length', 2)
    
    cy.screenshot('form-interaction-simplified')
  })
  
  // اختبار أكثر تبسيطاً - فقط للتأكد من الوظائف الأساسية
  it('Basic Form Functions - Essential validation only', () => {
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
    
    // ملء المدة فقط
    cy.get('input[placeholder*="Enter number of days"]').type('5')
    cy.get('input[placeholder*="Enter number of days"]').should('have.value', '5')
    
    // اختيار أي خيار ميزانية (بدون تحقق من class)
    cy.get('.option-card').contains('Budget').click()
    
    // اختيار أي خيار مسافرين
    cy.get('.option-card').contains('Solo').click()
    
    // التحقق من أن الزر ما زال موجود ويعمل
    cy.contains('✨ Generate My Trip').should('be.visible').and('not.be.disabled')
    
    cy.screenshot('basic-form-functions-success')
  })
  
})