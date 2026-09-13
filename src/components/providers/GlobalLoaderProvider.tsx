'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import GlobalFullScreenLoader from '../GlobalFullScreenLoader';

interface GlobalLoaderContextType {
  isLoading: boolean;
  startLoading: (msg?: string) => void;
  stopLoading: () => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export const useGlobalLoader = () => useContext(GlobalLoaderContext);

function RouteTransitionListener({
  setIsNavigating,
}: {
  setIsNavigating: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset navigating state whenever route finishes changing
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams, setIsNavigating]);

  // Intercept internal link clicks to display full-screen loader during navigation
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;

      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Ignore external links, downloads, new tabs, mailto/tel, and in-page anchor jumps
      if (
        target.target === '_blank' ||
        target.hasAttribute('download') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('#') ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      ) {
        return;
      }

      const currentUrl = window.location.pathname + window.location.search;
      if (href !== currentUrl && !href.startsWith(`${window.location.pathname}#`)) {
        setIsNavigating(true);
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [setIsNavigating]);

  return null;
}

export default function GlobalLoaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [programmaticLoading, setProgrammaticLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  // Safety fallback timeout in case navigation doesn't change path
  useEffect(() => {
    if (!isNavigating) return;
    const timeout = setTimeout(() => {
      setIsNavigating(false);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [isNavigating]);

  const startLoading = (msg = "Loading...") => {
    setLoadingMessage(msg);
    setProgrammaticLoading(true);
  };

  const stopLoading = () => {
    setProgrammaticLoading(false);
  };

  const active = isNavigating || programmaticLoading;

  return (
    <GlobalLoaderContext.Provider
      value={{
        isLoading: active,
        startLoading,
        stopLoading,
      }}
    >
      <React.Suspense fallback={null}>
        <RouteTransitionListener setIsNavigating={setIsNavigating} />
      </React.Suspense>
      {active && <GlobalFullScreenLoader message={loadingMessage} />}
      {children}
    </GlobalLoaderContext.Provider>
  );
}
