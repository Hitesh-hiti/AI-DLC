import React from 'react';

export type AppPage = 'search' | 'my-trips' | 'support';

interface HeaderProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
}) => {
  return (
    <header className="enterprise-navbar" role="banner">
      <div className="enterprise-navbar-inner">

        {/* ─────────────────────────────────────────────
            BRAND / LOGO
            ───────────────────────────────────────────── */}
        <button
          type="button"
          className="enterprise-brand"
          onClick={() => onNavigate('search')}
          aria-label="TravelPlatform home"
        >
          <img
            src="/logo.png"
            alt="TravelPlatform"
            className="enterprise-logo-image"
          />

          <span className="enterprise-brand-name">
            IGS TravelPlatform
          </span>
        </button>

        {/* ─────────────────────────────────────────────
            PRIMARY NAVIGATION
            ───────────────────────────────────────────── */}
        <nav
          className="enterprise-nav"
          aria-label="Primary navigation"
        >
          <button
            type="button"
            className={`enterprise-nav-item ${
              activePage === 'search' ? 'active' : ''
            }`}
            onClick={() => onNavigate('search')}
            aria-current={
              activePage === 'search' ? 'page' : undefined
            }
          >
            Search Flights
          </button>

          <button
            type="button"
            className={`enterprise-nav-item ${
              activePage === 'my-trips' ? 'active' : ''
            }`}
            onClick={() => onNavigate('my-trips')}
            aria-current={
              activePage === 'my-trips' ? 'page' : undefined
            }
          >
            My Trips
          </button>

          <button
            type="button"
            className={`enterprise-nav-item ${
              activePage === 'support' ? 'active' : ''
            }`}
            onClick={() => onNavigate('support')}
            aria-current={
              activePage === 'support' ? 'page' : undefined
            }
          >
            Support
          </button>
        </nav>

        {/* ─────────────────────────────────────────────
            HEADER ACTIONS
            ───────────────────────────────────────────── */}
        <div className="enterprise-header-actions">
          <button
            type="button"
            className="enterprise-signin"
          >
            Sign In
          </button>

          <button
            type="button"
            className="enterprise-signup"
          >
            Sign Up
          </button>
        </div>

      </div>
    </header>
  );
};