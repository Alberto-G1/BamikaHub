import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';
import './ThemeToggle.css';

/**
 * ThemeToggle Component - Button to switch between light/dark modes
 */
const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <FaSun className="theme-icon" />
      ) : (
        <FaMoon className="theme-icon" />
      )}
    </button>
  );
};

export default ThemeToggle;
