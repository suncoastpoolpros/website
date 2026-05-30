import { useEffect } from 'react';

/**
 * Sets document.title and <meta name="description"> for a route, restoring the
 * previous values on unmount so the homepage defaults aren't permanently
 * overwritten when SPA navigation moves away.
 */
export const usePageMeta = (title: string, description: string) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    const created = !meta;
    const prevDesc = meta?.getAttribute('content') ?? null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    return () => {
      document.title = prevTitle;
      if (created) meta!.remove();
      else if (prevDesc !== null) meta!.setAttribute('content', prevDesc);
    };
  }, [title, description]);
};
