import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Patch ResizeObserver to defer notifications to requestAnimationFrame and suppress benign errors
if (typeof window !== 'undefined') {
  const NativeResizeObserver = window.ResizeObserver;
  if (NativeResizeObserver) {
    window.ResizeObserver = class ResizeObserver extends NativeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        let frameId: number | null = null;
        super((entries, observer) => {
          if (frameId !== null) {
            cancelAnimationFrame(frameId);
          }
          frameId = requestAnimationFrame(() => {
            frameId = null;
            callback(entries, observer);
          });
        });
      }
    };
  }

  const isIgnoredError = (msg: unknown) => {
    if (typeof msg === 'string') {
      return (
        msg.includes('ResizeObserver') ||
        msg.includes('calculateTotalQuantity') ||
        msg.includes('OnPageLoaded') ||
        msg.includes('Ecwid') ||
        msg.includes('Audio capture failed to start') ||
        msg.includes('Permission denied') ||
        msg.includes('NotAllowedError') ||
        msg.includes('PermissionDeniedError')
      );
    }
    return false;
  };

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (args.some((arg) => isIgnoredError(arg) || (arg && isIgnoredError(arg.message)))) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  window.addEventListener(
    'error',
    (event) => {
      if (
        isIgnoredError(event.message) ||
        isIgnoredError(event.error?.message)
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (
        isIgnoredError(event.reason) ||
        isIgnoredError(event.reason?.message)
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
