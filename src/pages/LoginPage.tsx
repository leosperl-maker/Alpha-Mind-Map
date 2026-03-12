import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { isMockMode } from '../lib/supabase';
import { AppLogo } from '../components/common/AppLogo';
import { useBreakpoint } from '../hooks/useBreakpoint';

export const LoginPage: React.FC = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate(from, { replace: true });
  };

  const handleGoogle = async () => {
    setError('');
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err); return; }
    navigate(from, { replace: true });
  };

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <AppLogo size="lg" />
        <p style={{ marginTop: 16, fontSize: 14, color: '#636E72' }}>
          Connectez-vous à votre compte
        </p>
      </div>

      {isMockMode && (
        <div style={{
          background: '#FFF3CD', border: '1px solid #FDCB6E', borderRadius: 8,
          padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#856404', lineHeight: 1.5,
        }}>
          <strong>Mode démo</strong> — Supabase non configuré. Toute combinaison email/mot de passe fonctionne.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            autoFocus
            style={inputStyle}
          />
        </Field>

        <Field label="Mot de passe">
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ ...inputStyle, paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#636E72', fontSize: 14 }}
            >{showPassword ? '🙈' : '👁'}</button>
          </div>
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
          <Link to="/forgot-password" style={{ fontSize: 12, color: '#7C5CE7', textDecoration: 'none' }}>
            Mot de passe oublié ?
          </Link>
        </div>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <button type="submit" disabled={loading} style={primaryBtnStyle}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <Divider />

      <button onClick={handleGoogle} style={googleBtnStyle}>
        <GoogleIcon />
        Continuer avec Google
      </button>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#636E72' }}>
        Pas encore de compte ?{' '}
        <Link to="/signup" style={{ color: '#7C5CE7', fontWeight: 600, textDecoration: 'none' }}>
          S'inscrire
        </Link>
      </p>
    </AuthLayout>
  );
};

// ── Shared auth page layout ───────────────────────────────────────────────────

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile } = useBreakpoint();
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? 16 : 20,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        padding: isMobile ? '32px 24px' : '40px 36px',
        width: isMobile ? '90%' : '100%',
        maxWidth: 420,
      }}>
        {children}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3436' }}>{label}</label>
    {children}
  </div>
);

export const ErrorMsg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ background: '#FFE8E6', border: '1px solid #E17055', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#C0392B' }}>
    {children}
  </div>
);

export const Divider: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
    <div style={{ flex: 1, height: 1, background: '#DFE6E9' }} />
    <span style={{ fontSize: 12, color: '#b2bec3' }}>ou</span>
    <div style={{ flex: 1, height: 1, background: '#DFE6E9' }} />
  </div>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #DFE6E9',
  borderRadius: 8,
  fontSize: 14,
  color: '#2D3436',
  outline: 'none',
  transition: 'border-color 150ms',
  boxSizing: 'border-box',
};

export const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 20px',
  background: '#7C5CE7',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 150ms',
};

const googleBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 20px',
  background: '#fff',
  color: '#2D3436',
  border: '1px solid #DFE6E9',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  transition: 'background 150ms',
};
