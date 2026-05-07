import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line no-unused-vars
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('You have been signed out.');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to="/" className="navbar-brand">
        <div className="brand-icon">🎓</div>
        <span className="brand-name">EduFeedback</span>
      </Link>

      {/* Nav Links */}
      <ul className="navbar-links">
        <li>
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            📊 Dashboard
          </Link>
        </li>
        {isAdmin && (
          <li>
            <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>
              🛠️ Admin Panel
            </Link>
          </li>
        )}
      </ul>

      {/* User Badge */}
      <div className="navbar-user">
        <div className="user-badge">
          <div className="user-avatar">{initials}</div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user?.name}</span>
          <span className={`role-badge ${isAdmin ? 'admin' : ''}`}>
            {isAdmin ? 'Admin' : 'Student'}
          </span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleLogout}
          id="logout-btn"
          title="Logout"
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
