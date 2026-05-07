import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login as loginService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { key: 'student', icon: '🎓', label: 'Student', color: '#6366f1', desc: 'Access courses & submit feedback' },
  { key: 'admin', icon: '🛡️', label: 'Admin', color: '#f59e0b', desc: 'Manage courses & view analytics' },
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.password) errs.password = 'Password is required';
    return errs;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const userData = await loginService(formData);
      login(userData);
      toast.success(`Welcome back, ${userData.name}.`);
      navigate(userData.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      const msg = err.response?.data?.message || 'We could not sign you in. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill demo credentials when role icon is clicked
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setFormData({ email: 'admin@college.edu', password: 'admin123' });
    } else {
      setFormData({ email: 'alice@college.edu', password: 'student123' });
    }
    setErrors({});
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo">🎓</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Good to see you again. Sign in to continue.</p>
        </div>

        {/* Role Selector */}
        <div className="role-selector">
          <p className="role-selector-label">Sign in as</p>
          <div className="role-selector-options">
            {ROLES.map((role) => (
              <button
                key={role.key}
                type="button"
                className={`role-card ${selectedRole === role.key ? 'active' : ''}`}
                onClick={() => handleRoleSelect(role.key)}
                style={{
                  '--role-color': role.color,
                  borderColor: selectedRole === role.key ? role.color : 'var(--border)',
                  background: selectedRole === role.key ? `${role.color}12` : 'var(--bg-input)',
                }}
                id={`role-${role.key}`}
              >
                <div className="role-icon">{role.icon}</div>
                <div className="role-info">
                  <span className="role-name" style={{ color: selectedRole === role.key ? role.color : 'var(--text-primary)' }}>
                    {role.label}
                  </span>
                  <span className="role-desc">{role.desc}</span>
                </div>
                <div className={`role-check ${selectedRole === role.key ? 'visible' : ''}`} style={{ background: role.color }}>
                  ✓
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} id="login-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="name@college.edu"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              style={errors.email ? { borderColor: 'var(--error)' } : {}}
            />
            {errors.email && <p className="form-error">⚠ {errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              style={errors.password ? { borderColor: 'var(--error)' } : {}}
            />
            {errors.password && <p className="form-error">⚠ {errors.password}</p>}
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                Signing in...
              </>
            ) : (
              `Sign In as ${selectedRole === 'admin' ? 'Admin' : 'Student'}`
            )}
          </button>
        </form>

        <div
          style={{
            background: 'rgba(99,102,241,0.07)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginTop: '16px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <strong style={{ color: 'var(--text-secondary)' }}>💡 Tip:</strong> Click a role icon above to auto-fill demo credentials.
        </div>

        <p className="auth-link">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
