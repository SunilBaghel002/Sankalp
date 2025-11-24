// src/hooks/useDocumentTitle.ts
import { useEffect, useRef } from 'react';

/**
 * Custom hook to dynamically update document title
 * @param title - The title to set
 * @param prevailOnUnmount - If true, title persists after component unmounts
 */
export const useDocumentTitle = (title: string, prevailOnUnmount = false) => {
  const defaultTitle = useRef(document.title);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    return () => {
      if (!prevailOnUnmount) {
        document.title = defaultTitle.current;
      }
    };
  }, [prevailOnUnmount]);
};

export default useDocumentTitle;