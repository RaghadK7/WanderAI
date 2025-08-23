 it('Complete Workflow - Full user journey works', () => {
    // زيارة صفحة إنشاء الرحلة مباشرة
    cy.visit('/create-trip')
    cy.wait(3000)
    
    // التحقق من تحميل الصفحة
    cy.get('body').should('be.visible')
    
    // التحقق من وجود العنوان الرئيسي
    cy.contains('Share your travel preferences').should('be.visible')
    
    // التحقق من وجود العناصر الأساسية
    cy.get('input[placeholder*="Where would you like to go"]').should('be.visible')
    cy.get('input[placeholder*="Enter number of days"]').should('be.visible')
    
    // ملء بيانات الرحلة
    cy.get('input[placeholder*="Enter number of days"]').clear().type('5')
    
    // اختيار ميزانية Budget
    cy.get('.option-card').contains('Budget').click()
    cy.get('.option-card').contains('Budget').should('have.class', 'option-card-selected')
    
    // اختيار مسافرين Solo
    cy.get('.option-card').contains('Solo').click()
    cy.get('.option-card').contains('Solo').should('have.class', 'option-card-selected')
    
    // الضغط على زر إنشاء الرحلة
    cy.contains('✨ Generate My Trip').click()
    
    // التحقق من ظهور مربع تسجيل الدخول
    cy.get('.dialog-content').should('be.visible')
    cy.contains('Welcome Back').should('be.visible')
    
    cy.screenshot('complete-workflow-success')
  })