import React, { useState } from 'react';
import type { NodeMedia as NodeMediaType } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { useMapStore } from '../../store/mapStore';

interface NodeMediaProps {
  nodeId: string;
  media: NodeMediaType;
}

export const NodeMediaDisplay: React.FC<NodeMediaProps> = ({ nodeId, media }) => {
  const setLightboxImage = useUIStore(s => s.setLightboxImage);
  const updateNodeMedia = useMapStore(s => s.updateNodeMedia);
  const [imgHovered, setImgHovered] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  const imageSrc = media.image?.type === 'base64' ? media.image.data : media.image?.url;

  return (
    <div style={{ width: '100%' }}>
      {/* Image */}
      {media.image && imageSrc && (
        <div
          style={{ position: 'relative', marginBottom: media.link ? 6 : 0 }}
          onMouseEnter={() => setImgHovered(true)}
          onMouseLeave={() => setImgHovered(false)}
        >
          <img
            src={imageSrc}
            alt="node media"
            onClick={(e) => { e.stopPropagation(); setLightboxImage(imageSrc); }}
            style={{
              width: '100%',
              maxWidth: 200,
              maxHeight: 140,
              objectFit: 'cover',
              borderRadius: 4,
              display: 'block',
              cursor: 'zoom-in',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          />
          {imgHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateNodeMedia(nodeId, { ...media, image: undefined });
              }}
              onMouseDown={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: 2, right: 2,
                width: 18, height: 18, borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: 'none',
                color: '#fff', fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
              title="Supprimer l'image"
            >×</button>
          )}
        </div>
      )}

      {/* Link */}
      {media.link && (
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setLinkHovered(true)}
          onMouseLeave={() => setLinkHovered(false)}
        >
          <a
            href={media.link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: '#0984E3', textDecoration: 'none',
              background: 'rgba(9,132,227,0.07)',
              borderRadius: 4, padding: '2px 6px',
              overflow: 'hidden', maxWidth: '100%',
            }}
          >
            {media.link.favicon ? (
              <img src={media.link.favicon} alt="" style={{ width: 12, height: 12, objectFit: 'contain', flexShrink: 0 }} />
            ) : (
              <span style={{ fontSize: 12 }}>🔗</span>
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {media.link.title || new URL(media.link.url).hostname}
            </span>
          </a>
          {linkHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateNodeMedia(nodeId, { ...media, link: undefined });
              }}
              onMouseDown={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: 1, right: 1,
                width: 16, height: 16, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: 'none',
                color: '#fff', fontSize: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
              title="Supprimer le lien"
            >×</button>
          )}
        </div>
      )}
    </div>
  );
};
