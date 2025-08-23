it('Complete Workflow - Full user journey works', () => {
    // زيارة الصفحة الرئيسية
    cy.visit('/')
    cy.wait(3000)
    
    // التحقق من تحميل الصفحة الرئيسية
    cy.get('body').should('be.visible')
    cy.contains('Wander the world with WanderAI').should('be.visible')
    
    // البحث عن أي شيء مرتبط بـ Logo أو Navigation
    cy.get('body').then(($body) => {
      if ($body.text().includes('My Trips')) {
        cy.contains('My Trips').should('be.visible')
      }
      if ($body.text().includes('Sign')) {
        cy.get('body').should('contain.text', 'Sign')
      }
    })
    
    // الانتقال لصفحة إنشاء الرحلة
    cy.visit('/create-trip')
    cy.wait(3000)
    
    // التحقق من وصول لصفحة إنشاء الرحلة
    cy.url().should('include', '/create-trip')
    cy.contains('Share your travel preferences').should('be.visible')
    
    // ملء بيانات الرحلة
    cy.get('input[placeholder*="Enter number of days"]').clear().type('5')
    
    // اختيار ميزانية Budget
    cy.get('.option-card').contains('Budget').click()
    
    // اختيار مسافرين Solo
    cy.get('.option-card').contains('Solo').click()
    
    // الضغط على زر إنشاء الرحلة
    cy.contains('✨ Generate My Trip').click()
    
    // التحقق من ظهور مربع تسجيل الدخول
    cy.get('.dialog-content').should('be.visible')
    cy.contains('Welcome Back').should('be.visible')
    
    cy.screenshot('complete-workflow-success')
  })
  