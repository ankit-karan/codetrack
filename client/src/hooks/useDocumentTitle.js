import { useEffect } from 'react';

const BASE = 'CodeTrack';

/** Sets document.title as "<page> · CodeTrack". */
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : `${BASE} — DSA Progress & Intelligence Platform`;
  }, [title]);
}
