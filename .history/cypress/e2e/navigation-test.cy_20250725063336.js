it('Navigation Test - Core pages open without error', () => {
    // اختبار الصفحات الأساسية فقط
    const routes = ['/', '/create-trip']
    
    routes.forEach((route) => {
      cy.visit(route)
      cy.wait(2000)
      
      // التحقق من تحميل الصفحة بدون أخطاء
      cy.get('body').should('be.visible')
      
      // التحقق من عدم وجود رسائل خطأ واضحة
      cy.get('body').should('not.contain.text', '404')
      cy.get('body').should('not.contain.text', 'Error')
      cy.get('body').should('not.contain.text', 'Cannot')
      
      cy.screenshot(`route-test-${route.replace('/', 'home')}`)
    })
    
    // اختبار My Trips منفصل (لأنه قد يعيد توجيه)
    cy.visit('/my-trips', { failOnStatusCode: false })
    cy.wait(3000)
    cy.get('body').should('be.visible')
    cy.screenshot('route-test-my-trips')
    
    cy.screenshot('all-core-pages-accessible')
  })