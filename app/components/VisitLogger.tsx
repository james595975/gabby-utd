'use client';

import { useEffect } from 'react';

export default function VisitLogger() {
  useEffect(() => {
    const path = `${window.location.pathname}${window.location.search}`;
    const key = `gabby_visit_logged:${path}`;

    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'true');

    const payload = JSON.stringify({
      path,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent || null,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/visit', new Blob([payload], { type: 'application/json' }));
      return;
    }

    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      sessionStorage.removeItem(key);
    });
  }, []);

  return null;
}
