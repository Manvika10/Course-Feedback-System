import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register as registerService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { key: 'student', icon: '🎓', label: 'Student', color: '#6366f1', desc: 'Submit feedback & rate courses' },
  { key: 'admin', icon: '🛡️', label: 'Admin', color: '#f59e0b', desc: 'Manage courses, forms & analytics' },
];

const InputField = ({ id, label, type = 'text', placeholder, field, formData, errors, onChange }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>{label}</label>
    <input
      type={type}
      id={id}
      name={field}
      className="form-input"
      placeholder={placeholder}
      value={formData[field]}
      onChange={onChange}
      style={errors[field] ? { borderColor: 'var(--error)' } : {}}
    />
    {errors[field] && <p className="form-error">⚠ {errors[field]}</p>}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name || formData.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!formData.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.password || formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
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
      const { confirmPassword, ...payload } = formData;
      payload.role = selectedRole;
      const userData = await registerService(payload);
      login(userData);
      toast.success(`Your account is ready. Welcome, ${userData.name}.`);
      navigate(selectedRole === 'admin' ? '/admin' : '/');
    } catch (err) {
      const msg = err.response?.data?.message || 'We could not create your account. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo">✨</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the platform in less than a minute.</p>
        </div>

        {/* Role Selector */}
        <div className="role-selector">
          <p className="role-selector-label">I am a</p>
          <div className="role-selector-options">
            {ROLES.map((role) => (
              <button
                key={role.key}
                type="button"
                className={`role-card ${selectedRole === role.key ? 'active' : ''}`}
                onClick={() => setSelectedRole(role.key)}
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

        <form onSubmit={handleSubmit} id="register-form" noValidate>
          <InputField id="reg-name" label="Full Name" placeholder="John Doe" field="name" formData={formData} errors={errors} onChange={handleChange} />
          <InputField id="reg-email" label="Email Address" type="email" placeholder="john@college.edu" field="email" formData={formData} errors={errors} onChange={handleChange} />
          <InputField id="reg-password" label="Password" type="password" placeholder="Min. 6 characters" field="password" formData={formData} errors={errors} onChange={handleChange} />
          <InputField id="reg-confirm" label="Confirm Password" type="password" placeholder="Repeat your password" field="confirmPassword" formData={formData} errors={errors} onChange={handleChange} />

          <button
            type="submit"
            id="register-submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                Creating account...
              </>
            ) : (
              `Create ${selectedRole === 'admin' ? 'Admin' : 'Student'} Account`
            )}
          </button>
        </form>

        <p className="auth-link" style={{ marginTop: '20px' }}>
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
