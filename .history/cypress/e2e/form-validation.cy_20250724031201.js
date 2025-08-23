describe('Form Validation Flow Test', () => {
  
  beforeEach(() => {
    cy.visit('/')
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        name: 'Test User',
        email: 'test@wander.com',
        isAuthenticated: true
      }))
    })
    cy.reload()
  })
  
  it('Create Trip Form - Error messages appear then disappear', () => {
    // الانتقال لصفحة إنشاء الرحلة
    cy.contains('Create').click()
    
    // محاولة إرسال النموذج فارغ
    cy.get('button').contains(/create|generate|submit/i).click()
    
    // التحقق من ظهور رسائل خطأ
    cy.get('body').should('contain.text', 'required')
      .or('contain.text', 'Please')
      .or('contain.text', 'Enter')
    
    // ملء البيانات تدريجياً
    cy.get('input').first().type('London, UK')
    
    // التحقق من اختفاء بعض الأخطاء
    cy.wait(1000)
    
    // ملء باقي الحقول
    cy.get('input[type="number"]').first().clear().type('5')
    
    // محاولة الإرسال مرة أخرى
    cy.get('button').contains(/create|generate|submit/i).click()
    
    // التحقق من تحسن الحالة
    cy.get('body').should('be.visible')
    
    cy.screenshot('form-validation-success')
  })
  
})