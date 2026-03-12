import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { isMockMode } from '../lib/supabase';
import { AppLogo } from '../components/common/AppLogo';
import { AuthLayout, ErrorMsg, Divider, inputStyle, primaryBtnStyle } from './LoginPage';

export const SignupPage: React.FC = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setLoading(true);
    const { error: err } = await signUp(email, password, fullName);
    setLoading(false);
    if (err) { setError(err); return; }
    if (isMockMode) {
      navigate('/dashboard', { replace: true });
    } else {
      setSuccess(true);
    }
  };

  const handleGoogle = async () => {
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err); return; }
    navigate('/dashboard', { replace: true });
  };

  if (success) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#2D3436' }}>Vérifiez votre email</h2>
          <p style={{ fontSize: 14, color: '#636E72', lineHeight: 1.6 }}>
            Un email de confirmation a été envoyé à <strong>{email}</strong>.<br />
            Cliquez sur le lien pour activer votre compte.
          </p>
          <Link to="/login" style={{ display: 'inline-block', marginTop: 20, color: '#7C5CE7', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
            Retour à la connexion
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <AppLogo size="lg" />
        <p style={{ marginTop: 16, fontSize: 14, color: '#636E72' }}>
          Créez votre compte gratuit
        </p>
      </div>

      {isMockMode && (
        <div style={{
          background: '#FFF3CD', border: '1px solid #FDCB6E', borderRadius: 8,
          padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#856404', lineHeight: 1.5,
        }}>
          <strong>Mode démo</strong> — Supabase non configuré. Compte créé localement.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Nom complet">
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Léo Sperl"
            required
            autoFocus
            style={inputStyle}
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Mot de passe">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimum 6 caractères"
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Confirmer le mot de passe">
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              ...inputStyle,
              borderColor: confirm && confirm !== password ? '#E17055' : undefined,
            }}
          />
        </Field>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <button type="submit" disabled={loading} style={primaryBtnStyle}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>

      <Divider />

      <button
        onClick={handleGoogle}
        style={{
          width: '100%', padding: '10px 20px', background: '#fff', color: '#2D3436',
          border: '1px solid #DFE6E9', borderRadius: 8, fontSize: 14, fontWeight: 500,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        <GoogleIcon />
        Continuer avec Google
      </button>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#636E72' }}>
        Déjà un compte ?{' '}
        <Link to="/login" style={{ color: '#7C5CE7', fontWeight: 600, textDecoration: 'none' }}>
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3436' }}>{label}</label>
    {children}
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
