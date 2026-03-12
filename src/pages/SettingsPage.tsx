import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppLogo } from '../components/common/AppLogo';
import { isMockMode } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { inputStyle, ErrorMsg } from './LoginPage';
import { ALPHA_COLORS } from '../utils/colors';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pwError, setPwError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    const { error } = await updateProfile({ fullName });
    if (error) { setProfileError(error); return; }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) { setPwError('Les mots de passe ne correspondent pas.'); return; }
    if (newPw.length < 6) { setPwError('Minimum 6 caractères.'); return; }
    setPwStatus('saving');
    if (isMockMode) {
      await new Promise(r => setTimeout(r, 500));
      setPwStatus('saved');
      setTimeout(() => setPwStatus('idle'), 2500);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      return;
    }
    const { error } = await supabase!.auth.updateUser({ password: newPw });
    if (error) { setPwError(error.message); setPwStatus('error'); return; }
    setPwStatus('saved');
    setTimeout(() => setPwStatus('idle'), 2500);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') return;
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Top bar */}
      <div style={{
        height: 56, background: '#fff', borderBottom: '1px solid #DFE6E9',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#636E72', padding: 4 }}
          title="Retour au dashboard"
        >←</button>
        <AppLogo size="sm" />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: '#636E72' }}>Paramètres</span>
      </div>

      <div style={{ maxWidth: 600, margin: '32px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Profile */}
        <Card title="Profil">
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: ALPHA_COLORS.primary + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, color: ALPHA_COLORS.primary,
              }}>
                {(user?.fullName || user?.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#2D3436' }}>{user?.fullName || 'Sans nom'}</div>
                <div style={{ fontSize: 13, color: '#636E72' }}>{user?.email}</div>
              </div>
            </div>

            <Field label="Nom complet">
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} required />
            </Field>
            <Field label="Email">
              <input type="email" value={user?.email ?? ''} disabled style={{ ...inputStyle, background: '#F8F9FA', color: '#636E72' }} />
            </Field>

            {profileError && <ErrorMsg>{profileError}</ErrorMsg>}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="submit" style={saveBtnStyle}>Enregistrer</button>
              {profileSaved && <span style={{ fontSize: 13, color: '#00B894' }}>✓ Sauvegardé</span>}
            </div>
          </form>
        </Card>

        {/* Password */}
        <Card title="Mot de passe">
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isMockMode && (
              <Field label="Mot de passe actuel">
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={inputStyle} placeholder="••••••••" />
              </Field>
            )}
            <Field label="Nouveau mot de passe">
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle} placeholder="Minimum 6 caractères" required />
            </Field>
            <Field label="Confirmer le nouveau mot de passe">
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={inputStyle} placeholder="••••••••" required />
            </Field>

            {pwError && <ErrorMsg>{pwError}</ErrorMsg>}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="submit" disabled={pwStatus === 'saving'} style={saveBtnStyle}>
                {pwStatus === 'saving' ? 'Enregistrement…' : 'Changer le mot de passe'}
              </button>
              {pwStatus === 'saved' && <span style={{ fontSize: 13, color: '#00B894' }}>✓ Mot de passe modifié</span>}
            </div>
          </form>
        </Card>

        {/* Danger zone */}
        <Card title="Zone de danger">
          <p style={{ fontSize: 13, color: '#636E72', marginBottom: 16, lineHeight: 1.5 }}>
            La suppression de votre compte est irréversible. Toutes vos mind maps seront définitivement perdues.
          </p>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              style={{ padding: '9px 18px', background: 'none', border: '1px solid #E17055', borderRadius: 8, color: '#E17055', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Supprimer mon compte
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: '#E17055', margin: 0 }}>
                Tapez <strong>SUPPRIMER</strong> pour confirmer :
              </p>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="SUPPRIMER"
                style={{ ...inputStyle, borderColor: '#E17055' }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'SUPPRIMER'}
                  style={{ padding: '9px 18px', background: deleteConfirm === 'SUPPRIMER' ? '#E17055' : '#F8F9FA', color: deleteConfirm === 'SUPPRIMER' ? '#fff' : '#b2bec3', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: deleteConfirm === 'SUPPRIMER' ? 'pointer' : 'not-allowed' }}
                >
                  Confirmer la suppression
                </button>
                <button onClick={() => { setShowDelete(false); setDeleteConfirm(''); }} style={{ padding: '9px 18px', background: '#F8F9FA', border: '1px solid #DFE6E9', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#636E72' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ background: '#fff', border: '1px solid #DFE6E9', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
    <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#2D3436', borderBottom: '1px solid #F0F0F0', paddingBottom: 12 }}>{title}</h3>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#2D3436' }}>{label}</label>
    {children}
  </div>
);

const saveBtnStyle: React.CSSProperties = {
  padding: '9px 20px', background: ALPHA_COLORS.primary, color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
