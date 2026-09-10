/**
 * @fileoverview NavBar component — fixed left sidebar (desktop) / bottom tab bar (mobile).
 * Renders navigation items, logo, settings, and user avatar.
 * The avatar shows a guest gold dot indicator when the user is anonymous.
 */

import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { 
  Map as MapIcon, 
  Users, 
  Bot, 
  GraduationCap, 
  Settings, 
  User as UserIcon,
  Compass
} from 'lucide-react';

import { Button } from '@/shared/ui/Button';
import { NAV_ITEMS, TABS } from '@/shared/utils/constants';
import { useSettings } from '@/features/settings';

const ICON_MAP = {
  [TABS.JOURNEY]: <MapIcon size={20} />,
  [TABS.SIMULATE]: <Users size={20} />,
  [TABS.MENTOR]: <Bot size={20} />,
  [TABS.QUIZ]: <GraduationCap size={20} />,
};

/**
 * @typedef {Object} NavBarProps
 * @property {string} activeTab - Currently active tab ID
 * @property {Function} onTabChange - Callback when a nav item is clicked
 * @property {import('firebase/auth').User|null} user - Current Firebase user
 * @property {boolean} isGuest - True if the user is anonymous
 * @property {Function} onAvatarClick - Callback to open the auth modal
 */

/**
 * Application sidebar navigation component.
 * On desktop: 72px fixed left sidebar.
 * On mobile: full-width bottom tab bar (controlled via CSS).
 *
 * @param {NavBarProps} props
 * @returns {React.ReactElement}
 */
function NavBar({ activeTab, onTabChange, user = null, isGuest, onAvatarClick }) {
  const { settings } = useSettings();
  /**
   * Handle keyboard navigation for nav items.
   * Activates the item on Enter or Space.
   *
   * @param {React.KeyboardEvent} event
   * @param {string} tabId
   */
  const handleKeyDown = useCallback(
    (event, tabId) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onTabChange(tabId);
      }
    },
    [onTabChange]
  );

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Logo mark */}
      <div className="sidebar-logo" aria-hidden="true" title="CivicMind AI">
        <Compass size={32} className="logo-icon-premium" />
      </div>

      {/* Primary nav items */}
      <div className="sidebar-nav" role="list">
        {NAV_ITEMS.map((item) => (
          <div key={item.id} role="listitem">
            <Button
              variant="ghost"
              className={`nav-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => onTabChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              label={item.label}
              aria-current={activeTab === item.id ? 'page' : undefined}
              id={`nav-${item.id}`}
            >
              <span className="nav-icon" aria-hidden="true">
                {ICON_MAP[item.id]}
              </span>
              <span className="nav-label">{item.label}</span>
            </Button>
          </div>
        ))}
      </div>

      {/* Bottom: separator, settings, avatar */}
      <div className="sidebar-bottom">
        <div className="sidebar-separator" aria-hidden="true" />

        <Button
          variant="ghost"
          className={`nav-item${activeTab === TABS.SETTINGS ? ' active' : ''}`}
          onClick={() => onTabChange(TABS.SETTINGS)}
          label="Settings"
          id="nav-settings"
        >
          <span className="nav-icon" aria-hidden="true">
            <Settings size={20} />
          </span>
          <span className="nav-label">Settings</span>
        </Button>

        <Button
          variant="ghost"
          className="avatar-btn"
          onClick={onAvatarClick}
          label={user ? 'User Profile' : 'Sign In'}
          id="nav-avatar"
        >
          {settings?.preferences?.avatar ? (
            <img src={settings?.preferences?.avatar} alt="Profile" className="avatar-img-fill-small" />
          ) : user && user.email ? (
            user.email[0].toUpperCase()
          ) : user && user.displayName ? (
            user.displayName[0].toUpperCase()
          ) : (
            <UserIcon size={18} />
          )}
          {isGuest && <span className="avatar-guest-dot" aria-hidden="true" />}
        </Button>
      </div>
    </nav>
  );
}

NavBar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  user: PropTypes.object,
  isGuest: PropTypes.bool,
  onAvatarClick: PropTypes.func.isRequired,
};

export default React.memo(NavBar);
