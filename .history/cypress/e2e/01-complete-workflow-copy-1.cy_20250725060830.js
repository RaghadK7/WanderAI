 it('Complete Workflow - Full user journey works', () => {
    // زيارة الصفحة الرئيسية أولاً
    cy.visit('/')
    cy.wait(2000)
    
    // التحقق من تحميل الصفحة الرئيسية (Hero)
    cy.get('body').should('be.visible')
    
    // الانتقال لصفحة إنشاء الرحلة
    cy.visit('/create-trip')
    cy.wait(3000)
    
    // التحقق من تحميل صفحة إنشاء الرحلة
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