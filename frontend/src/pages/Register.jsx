import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { s } from '../styles';

// ── Password rule definitions ──────────────────────────────────
// Each rule has a label and a test function.
// We loop over these to show live checkmarks as the user types.
const PASSWORD_RULES = [
  { key: 'len',     label: 'At least 8 characters',       test: (v) => v.length >= 8 },
  { key: 'upper',   label: 'One uppercase letter (A–Z)',   test: (v) => /[A-Z]/.test(v) },
  { key: 'num',     label: 'One number (0–9)',             test: (v) => /[0-9]/.test(v) },
  { key: 'special', label: 'One special character (!@#$…)',test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
];

// ── Strength score → label + color ────────────────────────────
const getStrength = (score) => {
  if (score === 0) return { label: '',       color: '#E5E7EB' };
  if (score === 1) return { label: 'Weak',   color: '#EF4444' };
  if (score === 2) return { label: 'Fair',   color: '#F59E0B' };
  if (score === 3) return { label: 'Good',   color: '#F59E0B' };
  return            { label: 'Strong', color: '#10B981' };
};

export default function Register() {
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [errors,  setErrors]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const navigate = useNavigate();

  // ── Live validation checks ─────────────────────────────────
  const nameValid    = form.name.trim().length >= 2;
  const emailValid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const ruleResults  = PASSWORD_RULES.map(r => ({ ...r, met: r.test(form.password) }));
  const pwScore      = ruleResults.filter(r => r.met).length;
  const pwValid      = pwScore === PASSWORD_RULES.length;
  const strength     = getStrength(pwScore);
  const formValid    = nameValid && emailValid && pwValid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Mark field as touched as soon as user starts typing
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login', { state: { message: 'Account created! Please log in.' } });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors.map(e => e.msg));
      } else {
        setErrors([err.response?.data?.error || 'Registration failed.']);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Border color helper ────────────────────────────────────
  // Only show red/green AFTER the user has touched the field
  const borderColor = (field, isValid) => {
    if (!touched[field]) return '#D1D5DB'; // untouched = neutral gray
    return isValid ? '#10B981' : '#EF4444'; // touched = green or red
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.heading}>Create account</h2>

        {/* API errors from the server */}
        {errors.length > 0 && (
          <div style={styles.errorBox}>
            {errors.map((e, i) => <p key={i} style={{ margin: '2px 0' }}>• {e}</p>)}
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>

          {/* ── Name field ───────────────────────────────── */}
          <div>
            <label style={s.label}>Name</label>
            <div style={styles.inputWrap}>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Smith"
                style={{ ...s.input, borderColor: borderColor('name', nameValid) }}
              />
             
            </div>
            {/* Inline hint below field */}
            {touched.name && !nameValid && (
              <p style={styles.hintErr}>Name must be at least 2 characters</p>
            )}
            {touched.name && nameValid && (
              <p style={styles.hintOk}>Looks good!</p>
            )}
          </div>

          {/* ── Email field ───────────────────────────────── */}
          <div>
            <label style={s.label}>Email</label>
            <div style={styles.inputWrap}>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                style={{ ...s.input, borderColor: borderColor('email', emailValid) }}
              />
              
            </div>
            {touched.email && !emailValid && (
              <p style={styles.hintErr}>Enter a valid email address</p>
            )}
            {touched.email && emailValid && (
              <p style={styles.hintOk}>Valid email</p>
            )}
          </div>

          {/* ── Password field ────────────────────────────── */}
          <div>
            <label style={s.label}>Password</label>
            <div style={styles.inputWrap}>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                style={{ ...s.input, borderColor: borderColor('password', pwValid) }}
              />
              
            </div>

            {/* ── Strength bar — shows as soon as user starts typing ── */}
            {touched.password && form.password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      height: 4,
                      flex: 1,
                      borderRadius: 2,
                      // Only fill bars up to the current score
                      background: i < pwScore ? strength.color : '#E5E7EB',
                      transition: 'background 0.3s',
                    }}/>
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strength.color, fontWeight: 500 }}>
                  {strength.label}
                </span>
              </div>
            )}

            {/* ── Live password rules checklist ─────────────── */}
            {touched.password && (
              <div style={styles.rulesBox}>
                {ruleResults.map(rule => (
                  <div key={rule.key} style={styles.rule}>
                    {/* Circle icon — fills green when rule is met */}
                    <div style={{
                      width: 16, height: 16,
                      borderRadius: '50%',
                      border:      rule.met ? 'none' : '1.5px solid #D1D5DB',
                      background:  rule.met ? '#10B981' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}>
                      {rule.met && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{
                      fontSize: 13,
                      color: rule.met ? '#059669' : '#9CA3AF',
                      transition: 'color 0.2s',
                    }}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Submit button — disabled until all fields valid ── */}
          <button
            type="submit"
            disabled={!formValid || loading}
            style={{
              ...s.btn,
              opacity:  (!formValid || loading) ? 0.6 : 1,
              cursor:   (!formValid || loading) ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={s.sub}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

// ── Local styles (only what's not in styles.js) ───────────────
const styles = {
  inputWrap: { position: 'relative' },
  check:     { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 },
  hintOk:    { fontSize: 11, color: '#059669', marginTop: 3 },
  hintErr:   { fontSize: 11, color: '#EF4444', marginTop: 3 },
  rulesBox:  { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 },
  rule:      { display: 'flex', alignItems: 'center', gap: 8 },
  errorBox:  { background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 8 },
};