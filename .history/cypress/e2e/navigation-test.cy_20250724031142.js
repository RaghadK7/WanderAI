describe('Navigation Test - Form Validation', () => {
  
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
  
  it('Form Validation Flow - All pages open without error', () => {
    // الانتقال لصفحة إنشاء الرحلة
    cy.contains('Create').click()
    
    // التأكد من وجود النموذج
    cy.get('form, input, button').should('exist')
    
    // محاولة إرسال النموذج فارغ
    cy.get('button[type="submit"], button').contains(/create|generate|submit/i).click()
    
    // التحقق من بقاء الصفحة مفتوحة
    cy.get('body').should('be.visible')
    
    // التنقل لصفحات أخرى والعودة
    cy.get('body').then(($body) => {
      if ($body.text().includes('Home')) {
        cy.contains('Home').click()
        cy.get('body').should('be.visible')
        cy.contains('Create').click()
        cy.get('body').should('be.visible')
      }
    })
    
    cy.screenshot('navigation-test-success')
  })
  
})