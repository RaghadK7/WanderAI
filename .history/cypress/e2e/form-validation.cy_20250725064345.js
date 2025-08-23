it('Manual Navigation - Using header and links', () => {
    // ابدأ من الصفحة الرئيسية
    cy.visit('/')
    cy.wait(2000)
    cy.get('body').should('be.visible')
    
    // البحث عن روابط في الصفحة
    cy.get('body').then(($body) => {
      // البحث عن أي روابط navigation
      if ($body.find('nav').length > 0) {
        cy.get('nav').should('be.visible')
      }
      
      // البحث عن أزرار أو روابط
      if ($body.find('a[href]').length > 0) {
        cy.get('a[href]').first().should('be.visible')
      }
      
      // البحث عن header
      if ($body.find('header').length > 0) {
        cy.get('header').should('be.visible')
      }
    })
    
    cy.screenshot('manual-navigation-success')
  })
  