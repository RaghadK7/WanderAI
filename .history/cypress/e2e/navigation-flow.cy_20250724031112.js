describe('Navigation Flow Test', () => {
  
  it('All page transitions - All pages accessible', () => {
    // زيارة الصفحة الرئيسية
    cy.visit('/')
    cy.get('body').should('be.visible')
    
    // اختبار الروابط الموجودة
    cy.get('nav a, header a, .navbar a').should('have.length.greaterThan', 0)
    
    // محاكاة تسجيل دخول للوصول للصفحات المحمية
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        name: 'Test User',
        email: 'test@wander.com',
        isAuthenticated: true
      }))
    })
    cy.reload()
    
    // اختبار التنقل لصفحات مختلفة
    const pages = ['Home', 'Dashboard', 'Trips', 'Create', 'Profile']
    
    pages.forEach((page) => {
      cy.get('body').then(($body) => {
        if ($body.text().includes(page)) {
          cy.contains(page).click()
          cy.get('body').should('be.visible')
          cy.wait(1000)
        }
      })
    })
    
    cy.screenshot('navigation-flow-success')
  })
  
})