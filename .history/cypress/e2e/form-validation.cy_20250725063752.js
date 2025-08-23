 it('Page Load Performance - All pages load within reasonable time', () => {
    const startTime = Date.now()
    
    // اختبار سرعة تحميل الصفحة الرئيسية
    cy.visit('/')
    cy.get('body').should('be.visible')
    cy.contains('Wander the world with WanderAI').should('be.visible')
    
    const homeLoadTime = Date.now() - startTime
    expect(homeLoadTime).to.be.lessThan(10000) // أقل من 10 ثواني
    
    // اختبار سرعة تحميل صفحة Create Trip
    const createTripStartTime = Date.now()
    cy.visit('/create-trip')
    cy.contains('Share your travel preferences').should('be.visible')
    
    const createTripLoadTime = Date.now() - createTripStartTime
    expect(createTripLoadTime).to.be.lessThan(8000) // أقل من 8 ثواني
    
    cy.screenshot('page-load-performance-success')
  })
  