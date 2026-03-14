import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppLogo } from '../components/common/AppLogo';
import { isMockMode } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { inputStyle, ErrorMsg } from './LoginPage';
import { ALPHA_COLORS } from '../utils/colors';
import { getAISettings, saveAISettings } from '../utils/aiService';
import type { AISettings } from '../utils/aiService';

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

  const [aiSettings, setAISettings] = useState<AISettings>(getAISettings);
  const [aiSaved, setAISaved] = useState(false);

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    saveAISettings(aiSettings);
    setAISaved(true);
    setTimeout(() => setAISaved(false), 2500);
  };

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

        {/* AI Settings */}
        <Card title="Intelligence Artificielle (IA)">
          <form onSubmit={handleSaveAI} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Activer l'IA">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={aiSettings.enabled}
                  onChange={e => setAISettings(s => ({ ...s, enabled: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#2D3436' }}>Activer les fonctionnalités IA (Gemini)</span>
              </label>
            </Field>

            <div style={{ background: '#F0FFF4', border: '1px solid #C3FAE8', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#00695c', lineHeight: 1.5 }}>
              <strong>Gratuit :</strong> Alpha Mind Map inclut une clé partagée Gemini (limites : 1000 req/jour, 15/min).
              Pour des limites plus élevées, entrez votre propre clé.
            </div>

            <Field label="Fournisseur IA">
              <div style={{ padding: '9px 14px', background: '#F8F9FA', border: '1px solid #DFE6E9', borderRadius: 8, fontSize: 13, color: '#2D3436', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Gemini (Google)</span>
                <span style={{ fontSize: 11, color: '#00B894', background: '#E8FFF5', padding: '1px 8px', borderRadius: 12, fontWeight: 600 }}>Gratuit</span>
              </div>
            </Field>

            <Field label="Clé API Google AI Studio (optionnel)">
              <input
                type="password"
                value={aiSettings.geminiApiKey}
                onChange={e => setAISettings(s => ({ ...s, geminiApiKey: e.target.value }))}
                placeholder="AIzaSy… (laisser vide = tier gratuit partagé)"
                style={inputStyle}
                autoComplete="off"
              />
              <span style={{ fontSize: 11, color: '#636E72', marginTop: 4 }}>
                Obtenez votre clé sur{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: ALPHA_COLORS.primary }}>
                  aistudio.google.com
                </a>
              </span>
            </Field>

            <Field label="Modèle Gemini">
              <select
                value={aiSettings.model}
                onChange={e => setAISettings(s => ({ ...s, model: e.target.value }))}
                style={{ ...inputStyle, appearance: 'auto' }}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommandé)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </Field>

            <Field label="Langue des suggestions IA">
              <select
                value={aiSettings.language}
                onChange={e => setAISettings(s => ({ ...s, language: e.target.value as 'fr' | 'en' | 'es' }))}
                style={{ ...inputStyle, appearance: 'auto' }}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="submit" style={saveBtnStyle}>Enregistrer</button>
              {aiSaved && <span style={{ fontSize: 13, color: '#00B894' }}>✓ Sauvegardé</span>}
            </div>
          </form>
        </Card>

        {/* API Tokens */}
        <Card title="API & Intégrations">
          <APITokensSection />
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

// ── API Tokens Section ────────────────────────────────────────────────────────

const TOKENS_KEY = 'alpha-mind-map-api-tokens';

interface APIToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

function getTokens(): APIToken[] {
  try { return JSON.parse(localStorage.getItem(TOKENS_KEY) || '[]'); } catch { return []; }
}
function saveTokens(tokens: APIToken[]) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}
function genToken(): string {
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  return 'amm_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

const APITokensSection: React.FC = () => {
  const [tokens, setTokens] = React.useState<APIToken[]>(getTokens);
  const [showNew, setShowNew] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const t: APIToken = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      token: genToken(),
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };
    const updated = [...tokens, t];
    saveTokens(updated);
    setTokens(updated);
    setNewName('');
    setShowNew(false);
  };

  const handleRevoke = (id: string) => {
    if (!confirm('Révoquer ce token ? Les intégrations utilisant ce token cesseront de fonctionner.')) return;
    const updated = tokens.filter(t => t.id !== id);
    saveTokens(updated);
    setTokens(updated);
  };

  const handleCopy = (token: APIToken) => {
    navigator.clipboard.writeText(token.token);
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#636E72', lineHeight: 1.5 }}>
        Générez des tokens pour intégrer Alpha Mind Map avec des outils externes (n8n, Make, Zapier).
      </p>

      {tokens.length === 0 && (
        <div style={{ background: '#F8F9FA', border: '1px dashed #DFE6E9', borderRadius: 8, padding: '16px', textAlign: 'center', fontSize: 13, color: '#636E72' }}>
          Aucun token API. Cliquez sur "+" pour en créer un.
        </div>
      )}

      {tokens.map(t => (
        <div key={t.id} style={{ background: '#F8F9FA', border: '1px solid #DFE6E9', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#2D3436', marginBottom: 2 }}>🔑 {t.name}</div>
            <div style={{ fontSize: 12, color: '#636E72', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.token.slice(0, 16)}…
            </div>
            <div style={{ fontSize: 11, color: '#b2bec3', marginTop: 2 }}>Créé le {t.createdAt}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => handleCopy(t)}
              style={{ padding: '6px 12px', background: copiedId === t.id ? '#00B894' : '#fff', color: copiedId === t.id ? '#fff' : '#636E72', border: '1px solid #DFE6E9', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
            >
              {copiedId === t.id ? '✓ Copié' : 'Copier'}
            </button>
            <button
              onClick={() => handleRevoke(t.id)}
              style={{ padding: '6px 12px', background: 'none', color: '#E17055', border: '1px solid #FFD7D7', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
            >
              Révoquer
            </button>
          </div>
        </div>
      ))}

      {showNew ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowNew(false); setNewName(''); } }}
            placeholder="Nom du token (ex: n8n prod)"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleCreate} disabled={!newName.trim()} style={{ ...saveBtnStyle, opacity: newName.trim() ? 1 : 0.5 }}>Créer</button>
          <button onClick={() => { setShowNew(false); setNewName(''); }} style={{ padding: '9px 14px', background: '#F8F9FA', border: '1px solid #DFE6E9', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#636E72' }}>Annuler</button>
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          style={{ padding: '9px 18px', background: 'none', border: `1px solid ${ALPHA_COLORS.primary}`, borderRadius: 8, color: ALPHA_COLORS.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}
        >
          + Générer un nouveau token
        </button>
      )}

      <div style={{ fontSize: 12, color: '#b2bec3', lineHeight: 1.5 }}>
        Utilisation : <code style={{ background: '#F8F9FA', padding: '1px 4px', borderRadius: 3 }}>Authorization: Bearer {'<token>'}</code>
      </div>
    </div>
  );
};
