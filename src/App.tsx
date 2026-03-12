import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './components/Dashboard/DashboardPage';
import { MapEditorPage } from './pages/MapEditorPage';
import { SettingsPage } from './pages/SettingsPage';
import { useMapStore } from './store/mapStore';
import { useWorkspaceStore } from './store/workspaceStore';
import { useUIStore } from './store/uiStore';

// ── Bootstrap: seed demo map on first load + init workspace ──────────────────
function AppBootstrap() {
  const { user } = useAuth();
  const maps = useMapStore(s => s.maps);
  const createMap = useMapStore(s => s.createMap);
  const addNode = useMapStore(s => s.addNode);

  const recomputeLayout = useMapStore(s => s.recomputeLayout);
  const initForUser = useWorkspaceStore(s => s.initForUser);

  useEffect(() => {
    // Init default workspace for current user
    const ownerId = user?.id ?? 'local';
    initForUser(ownerId);

    // Seed demo map if no maps exist yet
    if (maps.length === 0) {
      const id = createMap('Ma première Mind Map', 'personal');
      setTimeout(() => {
        const { maps: currentMaps } = useMapStore.getState();
        const map = currentMaps.find(m => m.id === id);
        if (!map) return;
        const n1 = addNode(map.rootNodeId);
        const n2 = addNode(map.rootNodeId);
        const n3 = addNode(map.rootNodeId);
        const n4 = addNode(map.rootNodeId);

        setTimeout(() => {
          const { maps: m2, addNode: add2, updateNodeText: ut } = useMapStore.getState();
          const liveMap = m2.find(m => m.id === id);
          if (!liveMap) return;
          const nodeIds = [n1, n2, n3, n4];
          const labels = ['Idées', 'Tâches', 'Objectifs', 'Notes'];
          const subLabels: Record<string, string[]> = {
            'Idées': ['Brainstorm', 'Recherche'],
            'Tâches': ['En cours', 'À faire'],
            'Objectifs': ['Court terme', 'Long terme'],
            'Notes': ['Ressources', 'Références'],
          };
          nodeIds.forEach((nid, i) => {
            ut(nid, labels[i]);
            const c1 = add2(nid); const c2 = add2(nid);
            const { updateNodeText: ut2 } = useMapStore.getState();
            ut2(c1, subLabels[labels[i]][0]);
            ut2(c2, subLabels[labels[i]][1]);
          });

          recomputeLayout();
          const { fitToScreen } = useUIStore.getState();
          const finalMap = useMapStore.getState().maps.find(m => m.id === id);
          if (!finalMap) return;
          const nodes = Object.values(finalMap.nodes);
          const xs = nodes.map(n => n.position.x);
          const ys = nodes.map(n => n.position.y);
          fitToScreen(window.innerWidth, window.innerHeight - 56, {
            minX: Math.min(...xs), minY: Math.min(...ys),
            maxX: Math.max(...xs), maxY: Math.max(...ys),
          });
        }, 50);
      }, 10);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ── Root redirect: → /dashboard if logged in, else → /login ─────────────────
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter basename="/Alpha-Mind-Map">
      <AuthProvider>
        <AppBootstrap />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map/:id"
            element={
              <ProtectedRoute>
                <MapEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
