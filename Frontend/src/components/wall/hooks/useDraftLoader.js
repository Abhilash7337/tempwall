import { useState, useEffect } from 'react';

import { authFetch } from '../../../utils/auth';

export default function useDraftLoader({ draftId, isCollaborating, searchParams, setWallData, setDraftName, setLoading, setErrorMsg }) {
  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId) return;
      try {
        setLoading(true);
        setErrorMsg('');
        const sharedParam = searchParams.get('shared');
        const isShared = sharedParam === 'true';
        const token = searchParams.get('token');
        const endpoint = isShared
          ? `${import.meta.env.VITE_API_BASE_URL}/drafts/shared/${draftId}${token ? `?token=${token}` : ''}`
          : `${import.meta.env.VITE_API_BASE_URL}/drafts/single/${draftId}`;
        const response = isShared
          ? await fetch(endpoint)
          : await authFetch(endpoint);
        if (!response.ok) throw new Error('Failed to load draft');
        const draft = await response.json();
        setDraftName(draft.name);
        const { wallData } = draft;
        if (wallData) setWallData(wallData);
        if (isCollaborating) {
          // Use wss if VITE_API_BASE_URL is https, else ws
          const wsProtocol = import.meta.env.VITE_API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
          const wsBase = import.meta.env.VITE_API_BASE_URL.replace(/^https?:\/\//, '');
          const ws = new window.WebSocket(`${wsProtocol}://${wsBase}/drafts/${draftId}/collaborate`);
          ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            if (update.type === 'wall_update') {
              setWallData(update.wallData);
            }
          };
          return () => ws.close();
        }
      } catch (error) {
        setErrorMsg('Error loading draft or you do not have access.');
      } finally {
        setLoading(false);
      }
    };
    loadDraft();
    // eslint-disable-next-line
  }, [draftId, isCollaborating]);
}
