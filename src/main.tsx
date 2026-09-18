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
    if (!msg) return false;
    let strMsg = '';
    if (typeof msg === 'string') {
      strMsg = msg;
    } else if (typeof msg === 'object') {
      try {
        strMsg = (msg as any)?.message || (msg as any)?.reason || JSON.stringify(msg) || '';
      } catch (e) {
        strMsg = String(msg);
      }
    }
    if (strMsg) {
      return (
        strMsg.includes('ResizeObserver') ||
        strMsg.includes('calculateTotalQuantity') ||
        strMsg.includes('OnPageLoaded') ||
        strMsg.includes('Ecwid') ||
        strMsg.includes('Audio capture failed to start') ||
        strMsg.includes('Permission denied') ||
        strMsg.includes('NotAllowedError') ||
        strMsg.includes('PermissionDeniedError') ||
        strMsg.includes('client is offline') ||
        strMsg.includes('Failed to get document') ||
        strMsg.includes('offline') ||
        strMsg.includes('spending cap') ||
        strMsg.includes('límite de gasto') ||
        strMsg.includes('monthly spending') ||
        strMsg.includes('Server reported error') ||
        strMsg.includes('WebSocket error') ||
        strMsg.includes('isTrusted') ||
        strMsg.includes('RESOURCE_EXHAUSTED') ||
        strMsg.includes('Server connection error')
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
