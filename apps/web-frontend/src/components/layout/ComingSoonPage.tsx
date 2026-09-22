import React from 'react';

interface ComingSoonPageProps {
  title: string;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ title }) => (
  <section className="coming-soon-page" aria-labelledby="coming-soon-title">
    <div className="coming-soon-card">
      <div className="coming-soon-icon" aria-hidden="true">•••</div>
      <span className="coming-soon-label">TRAVELPLATFORM</span>
      <h1 id="coming-soon-title">{title}</h1>
      <div className="coming-soon-divider" />
      <p className="coming-soon-text">Coming...</p>
      <p className="coming-soon-description">
        This section is currently being prepared for the enterprise travel platform.
      </p>
    </div>
  </section>
);
