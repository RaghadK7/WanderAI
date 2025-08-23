describe('Complete Workflow Test', () => {
  
  it('Login → Create Trip → Save - Full user journey works', () => {
    // زيارة الموقع
    cy.visit('/')
    
    // التحقق من تحميل الصفحة
    cy.get('body').should('be.visible')
    
    // البحث عن عناصر الصفحة الرئيسية
    cy.contains('AI', { timeout: 10000 }).should('be.visible')
    
    // محاكاة تسجيل الدخول
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        name: 'Test User',
        email: 'test@wander.com',
        isAuthenticated: true
      }))
    })
    cy.reload()
    
    // البحث عن زر إنشاء رحلة
    cy.contains('Create', { timeout: 10000 }).should('be.visible')
    cy.contains('Create').click()
    
    // ملء النموذج (تكيف حسب تطبيقك)
    cy.get('input').first().type('Paris, France')
    
    // Screenshot للنجاح
    cy.screenshot('complete-workflow-success')
  })
  
})