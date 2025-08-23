it('Navigation Flow - All core pages accessible', () => {
    // اختبار الصفحة الرئيسية
    cy.visit('/')
    cy.wait(3000)
    cy.get('body').should('be.visible')
    cy.contains('Wander the world with WanderAI').should('be.visible')
    cy.screenshot('page-home')
    
    // اختبار صفحة Create Trip
    cy.visit('/create-trip')
    cy.wait(3000)
    cy.contains('Share your travel preferences').should('be.visible')
    cy.screenshot('page-create-trip')
    
    // اختبار صفحة My Trips (مع تجاهل إعادة التوجيه)
    cy.visit('/my-trips', { failOnStatusCode: false })
    cy.wait(3000)
    cy.get('body').should('be.visible')
    cy.screenshot('page-my-trips')
    
    cy.screenshot('navigation-flow-success')
  })