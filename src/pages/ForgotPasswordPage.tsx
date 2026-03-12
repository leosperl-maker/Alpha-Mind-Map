import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isMockMode } from '../lib/supabase';
import { AppLogo } from '../components/common/AppLogo';
import { AuthLayout, ErrorMsg, inputStyle, primaryBtnStyle } from './LoginPage';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (isMockMode) {
      await new Promise(r => setTimeout(r, 600));
      setSent(true);
      setLoading(false);
      return;
    }
    const { error: err } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/Alpha-Mind-Map/reset-password',
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <AppLogo size="lg" />
        <p style={{ marginTop: 16, fontSize: 14, color: '#636E72' }}>
          Réinitialiser votre mot de passe
        </p>
      </div>

      {sent ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#2D3436' }}>Email envoyé !</h3>
          <p style={{ fontSize: 14, color: '#636E72', lineHeight: 1.6 }}>
            Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation.
          </p>
          <Link
            to="/login"
            style={{ display: 'inline-block', marginTop: 24, padding: '10px 24px', background: '#7C5CE7', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 14, color: '#636E72', marginBottom: 24, lineHeight: 1.6 }}>
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3436' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoFocus
                style={inputStyle}
              />
            </div>

            {error && <ErrorMsg>{error}</ErrorMsg>}

            <button type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#636E72' }}>
            <Link to="/login" style={{ color: '#7C5CE7', textDecoration: 'none' }}>← Retour à la connexion</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
};
