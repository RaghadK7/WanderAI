describe('Debug Test - What is in my app?', () => {
  
  it('should explore what elements exist in the app', () => {
    // زيارة الموقع
    cy.visit('/')
    
    // انتظار التحميل
    cy.wait(3000)
    
    // التحقق من تحميل الصفحة
    cy.get('body').should('be.visible')
    
    // طباعة محتوى الصفحة للتشخيص
    cy.get('body').then(($body) => {
      console.log('Page content:', $body.text())
    })
    
    // البحث عن أي أزرار موجودة
    cy.get('button').should('exist')
    cy.get('button').then(($buttons) => {
      console.log('Found buttons:', $buttons.length)
      $buttons.each((index, button) => {
        console.log(`Button ${index}:`, button.textContent)
      })
    })
    
    // البحث عن أي روابط موجودة
    cy.get('a').then(($links) => {
      console.log('Found links:', $links.length)
      $links.each((index, link) => {
        console.log(`Link ${index}:`, link.textContent)
      })
    })
    
    // البحث عن أي حقول إدخال
    cy.get('input').then(($inputs) => {
      console.log('Found inputs:', $inputs.length)
      $inputs.each((index, input) => {
        console.log(`Input ${index}:`, input.placeholder || input.type)
      })
    })
    
    // أخذ screenshot لنشوف الصفحة
    cy.screenshot('current-app-state')
  })
  
})