it('Navigation Flow - All pages accessible', () => {
    // اختبار الصفحة الرئيسية
    cy.visit('/')
    cy.wait(2000)
    cy.get('body').should('be.visible')
    cy.contains('Wander the world with WanderAI').should('be.visible')
    cy.screenshot('page-home')
    
    // اختبار صفحة Create Trip
    cy.visit('/create-trip')
    cy.wait(2000)
    cy.contains('Share your travel preferences').should('be.visible')
    cy.screenshot('page-create-trip')
    
    // اختبار صفحة My Trips
    cy.visit('/my-trips')
    cy.wait(2000)
    cy.get('body').should('be.visible')
    cy.screenshot('page-my-trips')
    
    // اختبار باقي الصفحات
    cy.visit('/terms')
    cy.wait(2000)
    cy.get('body').should('be.visible')
    cy.screenshot('page-terms')
    
    cy.visit('/privacy')
    cy.wait(2000)
    cy.get('body').should('be.visible')
    cy.screenshot('page-privacy')
    
    cy.screenshot('navigation-flow-success')
  })
  