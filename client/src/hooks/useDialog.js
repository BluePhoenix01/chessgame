import { useRef } from 'react';

export function useDialog() {
  const ref = useRef(null);

  const open = () => ref.current?.showModal();
  const close = (returnValue) => ref.current?.close(returnValue);

  return { ref, open, close };
}