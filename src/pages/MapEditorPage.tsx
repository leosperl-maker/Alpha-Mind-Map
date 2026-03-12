import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMapStore } from '../store/mapStore';
import { TopToolbar } from '../components/Toolbar/TopToolbar';
import { NodeToolbar } from '../components/Toolbar/NodeToolbar';
import { ConnectorToolbar } from '../components/Toolbar/ConnectorToolbar';
import { MindMapCanvas } from '../components/Canvas/MindMapCanvas';
import { PersonalizePanel } from '../components/Panels/PersonalizePanel';
import { NotesPanel } from '../components/Panels/NotesPanel';
import { ExportPanel } from '../components/Panels/ExportPanel';
import { SharePanel } from '../components/Panels/SharePanel';
import { ContextMenu } from '../components/common/ContextMenu';
import { SearchBar } from '../components/common/SearchBar';

export const MapEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const maps = useMapStore(s => s.maps);
  const setActiveMap = useMapStore(s => s.setActiveMap);
  const activeMapId = useMapStore(s => s.activeMapId);

  useEffect(() => {
    if (!id) { navigate('/dashboard', { replace: true }); return; }
    const map = maps.find(m => m.id === id);
    if (!map) { navigate('/dashboard', { replace: true }); return; }
    if (activeMapId !== id) setActiveMap(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keyboard shortcut Ctrl+N → new map
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/dashboard');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  if (!id || !maps.find(m => m.id === id)) return null;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <TopToolbar />
      <NodeToolbar />
      <ConnectorToolbar />
      <MindMapCanvas />
      <PersonalizePanel />
      <NotesPanel />
      <ExportPanel />
      <SharePanel />
      <ContextMenu />
      <SearchBar />
    </div>
  );
};
