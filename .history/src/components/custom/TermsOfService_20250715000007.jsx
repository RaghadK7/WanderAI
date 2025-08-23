import React from 'react';
import './TermsOfService.css';

const TermsOfService = () => {
  return (
    <div className="terms-page">
      {/* Sky Garden Background */}
      <div className="sky-garden">
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="cloud cloud-3"></div>
        <div className="cloud cloud-4"></div>
        <div className="sun-rays"></div>
        <div className="floating-leaf leaf-1">🍃</div>
        <div className="floating-leaf leaf-2">🌿</div>
        <div className="floating-leaf leaf-3">🍃</div>
        <div className="floating-petal petal-1">🌸</div>
        <div className="floating-petal petal-2">🌺</div>
        <div className="bird bird-1">🕊️</div>
        <div className="bird bird-2">🦋</div>
      </div>

      {/* Header Section */}
      <div className="terms-header">
        <div className="terms-container">
          <div className="header-content">
            <div className="garden-circle">
              <div className="inner-garden">
                <span className="header-emoji">⚖️</span>
                <div className="garden-petals">
                  <div className="petal petal-1"></div>
                  <div className="petal petal-2"></div>
                  <div className="petal petal-3"></div>
                  <div className="petal petal-4"></div>
                </div>
              </div>
            </div>
            <h1 className="page-title">
              <span className="title-word">Terms</span>
              <span className="title-word">of</span>
              <span className="title-word">Service</span>
            </h1>
            <p className="page-subtitle">
              In our peaceful digital garden 🌸 Where trust blooms eternal
            </p>
            <div className="nature-badge">
              <span className="badge-icon">🌱</span>
              <span>Cultivated with care since January 2025</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="terms-content">
        <div className="terms-container">
          
          {/* Welcome Section */}
          <section className="terms-section garden-welcome">
            <div className="section-flower">🌻</div>
            <h2>Welcome to Our Digital Garden</h2>
            <p>
              Welcome to WanderAI, where technology blossoms like flowers in spring! 
              Our AI-powered travel planning grows from seeds of innovation into 
              beautiful journeys. By exploring our digital garden, you agree to nurture 
              these terms with the same care we put into crafting your perfect adventures.
            </p>
          </section>

          {/* Service Description */}
          <section className="terms-section">
            <div className="section-header">
              <div className="section-flower">🤖</div>
              <h2>Our Blooming AI Services</h2>
            </div>
            <div className="service-garden">
              <div className="service-flower">
                <div className="flower-stem"></div>
                <div className="flower-bloom">
                  <div className="bloom-icon">🌍</div>
                  <h3>Personalized Itineraries</h3>
                  <p>Like a gardener tends to each plant, our AI nurtures travel plans tailored to your unique spirit.</p>
                </div>
              </div>
              <div className="service-flower">
                <div className="flower-stem"></div>
                <div className="flower-bloom">
                  <div className="bloom-icon">✨</div>
                  <h3>Smart Recommendations</h3>
                  <p>Our AI wisdom flows like morning dew, bringing fresh insights for your travel adventures.</p>
                </div>
              </div>
              <div className="service-flower">
                <div className="flower-stem"></div>
                <div className="flower-bloom">
                  <div className="bloom-icon">🌸</div>
                  <h3>Travel Insights</h3>
                  <p>Gather knowledge like petals in the wind - beautiful, natural, and perfectly arranged.</p>
                </div>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="terms-section">
            <div className="section-header">
              <div className="section-flower">🌱</div>
              <h2>Your Garden Duties</h2>
            </div>
            <div className="responsibility-garden">
              <div className="responsibility-tree">
                <div className="tree-icon">🌳</div>
                <div className="tree-content">
                  <h3>Plant Truth</h3>
                  <p>Share honest preferences so our AI can grow the most beautiful travel experiences for you.</p>
                </div>
              </div>
              <div className="responsibility-tree">
                <div className="tree-icon">🕊️</div>
                <div className="tree-content">
                  <h3>Peaceful Harmony</h3>
                  <p>Navigate our garden with kindness and respect for all fellow travelers.</p>
                </div>
              </div>
              <div className="responsibility-tree">
                <div className="tree-icon">🔍</div>
                <div className="tree-content">
                  <h3>Wise Verification</h3>
                  <p>Like checking if soil is ready for planting, verify travel details before your journey begins.</p>
                </div>
              </div>
            </div>
          </section>

          {/* AI Limitations */}
          <section className="terms-section morning-mist">
            <div className="mist-overlay"></div>
            <div className="section-header">
              <div className="section-flower">🌅</div>
              <h2>Morning Wisdom from Our AI</h2>
            </div>
            <p>
              Our AI speaks through algorithms like morning birds through song. While our 
              digital gardeners strive for perfection, the world of travel changes like 
              seasons. Verify earthly details as you would check the weather before 
              stepping into your beautiful journey.
            </p>
          </section>

          {/* Intellectual Property */}
          <section className="terms-section">
            <div className="section-header">
              <div className="section-flower">💎</div>
              <h2>Seeds of Innovation</h2>
            </div>
            <p>
              WanderAI's digital garden - our code, AI insights, and platform beauty - 
              grows from our careful cultivation. You may enjoy the fruits of our garden 
              for personal journeys, but the seeds and saplings remain rooted in our soil.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="terms-section">
            <div className="section-header">
              <div className="section-flower">🛡️</div>
              <h2>Garden Boundaries</h2>
            </div>
            <p>
              WanderAI tends the garden of travel planning, not the booking of actual 
              journeys. We nurture dreams and guide paths, but cannot control the 
              weather of your physical adventures. Our care extends as far as our 
              garden walls permit.
            </p>
          </section>

          {/* Updates */}
          <section className="terms-section">
            <div className="section-header">
              <div className="section-flower">🔄</div>
              <h2>Seasons of Change</h2>
            </div>
            <p>
              Like gardens that bloom differently each season, these terms may grow and 
              evolve. We'll share news of significant changes like announcing the first 
              spring flowers. Continued walks through our garden mean you embrace our 
              natural evolution.
            </p>
          </section>

          {/* Contact */}
          <section className="terms-section sunset-contact">
            <div className="sunset-glow"></div>
            <div className="section-header">
              <div className="section-flower">💌</div>
              <h2>Garden Messages</h2>
            </div>
            <p>
              Questions about our garden terms? Ready to plant the seeds of your dream 
              journey? Send us a message on the morning breeze - we're here to help 
              your travel dreams bloom into beautiful reality!
            </p>
            <div className="nature-signature">
              <span className="signature-icon">🌸</span>
              <span>Where your tech dreams came true</span>
              <span className="signature-butterfly">🦋</span>
            </div>
          </section>

        </div>
      </div>

      {/* Back Button */}
      <div className="back-section">
        <div className="terms-container">
          <button 
            className="garden-back-btn"
            onClick={() => window.history.back()}
          >
            <span className="btn-icon">🏡</span>
            <span>Return Home</span>
            <div className="btn-breeze"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;