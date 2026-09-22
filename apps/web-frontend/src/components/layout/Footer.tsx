import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-section">
          <h4 className="footer-section-title">TravelPlatform</h4>
          <p className="footer-section-text">
            Your trusted partner for flight bookings worldwide.
            Transparent pricing, flexible options, and 24/7 support.
          </p>
        </div>
        <div className="footer-section">
          <h4 className="footer-section-title">Company</h4>
          <ul className="footer-links">
            <li><a href="#about">About Us</a></li>
            <li><a href="#careers">Careers</a></li>
            <li><a href="#press">Press</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4 className="footer-section-title">Support</h4>
          <ul className="footer-links">
            <li><a href="#help">Help Center</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#refunds">Refunds</a></li>
            <li><a href="#support">Contact Support</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4 className="footer-section-title">Legal</h4>
          <ul className="footer-links">
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#cookies">Cookie Policy</a></li>
            <li><a href="#accessibility">Accessibility</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-bottom-text">&copy; 2026 TravelPlatform. All rights reserved.</p>
        <div className="footer-bottom-actions">
          <button type="button" className="footer-language-btn" aria-label="Change language">🌐 English</button>
          <button type="button" className="footer-currency-btn" aria-label="Change currency">💵 USD</button>
        </div>
      </div>
    </footer>
  );
};
