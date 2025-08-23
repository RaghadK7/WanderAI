describe('Trip Generation Test', () => {
  
  beforeEach(() => {
    cy.visit('/')
    // محاكاة تسجيل دخول
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        name: 'Test User',
        email: 'test@wander.com',
        isAuthenticated: true
      }))
    })
    cy.reload()
  })
  
  it('AI trip creation process - Trip successfully generated', () => {
    // الانتقال لصفحة إنشاء الرحلة
    cy.contains('Create').click()
    
    // ملء بيانات شاملة
    cy.get('input[placeholder*="destination"], input[placeholder*="where"]')
      .type('Tokyo, Japan')
    
    // البحث عن حقل المدة
    cy.get('input[type="number"], input[placeholder*="days"]')
      .clear()
      .type('7')
    
    // البحث عن زر الإنشاء
    cy.contains('Generate', { timeout: 5000 }).click()
    
    // انتظار التوليد
    cy.contains('Generating', { timeout: 10000 }).should('be.visible')
    
    // انتظار اكتمال التوليد
    cy.contains('Day', { timeout: 30000 }).should('be.visible')
    
    cy.screenshot('trip-generation-success')
  })
  
})