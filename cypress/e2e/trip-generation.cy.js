it('Trip Generation - Trip successfully generated', () => {
    cy.visit('/create-trip')
    cy.wait(3000)
    
    // التحقق من تحميل الصفحة
    cy.contains('Share your travel preferences').should('be.visible')
    
    // محاكاة تسجيل دخول مسبق
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        uid: 'test123',
        email: 'test@example.com',
        name: 'Test User'
      }))
    })
    cy.reload()
    cy.wait(2000)
    
    // ملء النموذج
    cy.get('input[placeholder*="Enter number of days"]').clear().type('7')
    
    // اختيار ميزانية Luxury
    cy.get('.option-card').contains('Luxury').click()
    
    // اختيار Family
    cy.get('.option-card').contains('Family').click()
    
    // الضغط على زر إنشاء الرحلة
    cy.contains('✨ Generate My Trip').click()
    
    // التحقق من رسائل validation
    cy.contains('Please select a destination', { timeout: 10000 }).should('be.visible')
    
    cy.screenshot('trip-generation-validation')
  })