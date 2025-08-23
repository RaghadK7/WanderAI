it('Complete Workflow - Full user journey works', () => {
    // زيارة الصفحة الرئيسية
    cy.visit('/')
    cy.wait(3000)
    
    // التحقق من تحميل الصفحة الرئيسية
    cy.get('body').should('be.visible')
    cy.contains('Wander the world with WanderAI').should('be.visible')
    
    // التحقق من وجود Header
    cy.contains('WANDER-AI').should('be.visible')
    cy.contains('My Trips').should('be.visible')
    
    // الانتقال لصفحة إنشاء الرحلة عبر الضغط على زر في الصفحة
    // (قد يكون هناك زر "Get Started" أو "Create Trip")
    cy.get('body').then(($body) => {
      if ($body.text().includes('Get Started')) {
        cy.contains('Get Started').click()
      } else if ($body.text().includes('Create Trip')) {
        cy.contains('Create Trip').click()
      } else {
        // الانتقال مباشرة للراوت
        cy.visit('/create-trip')
      }
    })
    
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