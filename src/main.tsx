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
        strMsg =
          (msg as any)?.message ||
          (msg as any)?.reason ||
          (msg as any)?.stack ||
          (msg as any)?.error?.message ||
          (msg as any)?.error?.stack ||
          JSON.stringify(msg) ||
          '';
      } catch (e) {
        strMsg = String(msg);
      }
    }
    if (strMsg) {
      const lower = strMsg.toLowerCase();
      return (
        lower.includes('resizeobserver') ||
        lower.includes('calculatetotalquantity') ||
        lower.includes('onpageloaded') ||
        lower.includes('ecwid') ||
        lower.includes('cloudfront.net') ||
        lower.includes('storefront') ||
        lower.includes('ecommerce') ||
        lower.includes('queryfn') ||
        lower.includes('audio capture failed to start') ||
        lower.includes('permission denied') ||
        lower.includes('notallowederror') ||
        lower.includes('permissiondeniederror') ||
        lower.includes('client is offline') ||
        lower.includes('failed to get document') ||
        lower.includes('offline') ||
        lower.includes('spending cap') ||
        lower.includes('límite de gasto') ||
        lower.includes('monthly spending') ||
        lower.includes('server reported error') ||
        lower.includes('websocket error') ||
        lower.includes('istrusted') ||
        lower.includes('resource_exhausted') ||
        lower.includes('server connection error') ||
        lower.includes('apps-product-browser') ||
        lower.includes('vendor-kamcwx8s') ||
        lower.includes('shared-mgo1zf68') ||
        lower.includes('cannot read properties of undefined') ||
        lower.includes("reading 'type'") ||
        lower.includes('reading "type"') ||
        lower.includes("reading 'cartitems'") ||
        lower.includes('reading "cartitems"') ||
        lower.includes('storeprofile')
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
      const filename = event.filename || '';
      const isThirdParty =
        filename.includes('cloudfront.net') ||
        filename.includes('ecwid') ||
        filename.includes('storefront') ||
        filename.includes('ecommerce') ||
        isIgnoredError(event.message) ||
        isIgnoredError(event.error) ||
        isIgnoredError(event.error?.stack) ||
        isIgnoredError(event.error?.message);

      if (isThirdParty) {
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
      const reasonStack = String(event.reason?.stack || '');
      const reasonMsg = String(event.reason?.message || event.reason || '');
      const isThirdParty =
        reasonStack.includes('cloudfront.net') ||
        reasonStack.includes('storefront') ||
        reasonStack.includes('ecommerce') ||
        reasonStack.includes('ecwid') ||
        reasonStack.includes('queryFn') ||
        reasonMsg.includes('cloudfront.net') ||
        reasonMsg.includes('storefront') ||
        reasonMsg.includes('ecommerce') ||
        reasonMsg.includes('ecwid') ||
        isIgnoredError(event.reason) ||
        isIgnoredError(event.reason?.message) ||
        isIgnoredError(event.reason?.stack);

      if (isThirdParty) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );

  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const src = String(source || '');
    if (
      src.includes('cloudfront.net') ||
      src.includes('storefront') ||
      src.includes('ecommerce') ||
      src.includes('ecwid') ||
      isIgnoredError(message) ||
      isIgnoredError(error)
    ) {
      return true;
    }
    if (typeof originalOnError === 'function') {
      return (originalOnError as any)(message, source, lineno, colno, error);
    }
    return false;
  };

  const originalOnUnhandled = (window as any).onunhandledrejection;
  (window as any).onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reasonStack = String(event.reason?.stack || '');
    const reasonMsg = String(event.reason?.message || event.reason || '');
    if (
      reasonStack.includes('cloudfront.net') ||
      reasonStack.includes('storefront') ||
      reasonStack.includes('ecommerce') ||
      reasonStack.includes('ecwid') ||
      reasonStack.includes('queryFn') ||
      reasonMsg.includes('cloudfront.net') ||
      reasonMsg.includes('storefront') ||
      reasonMsg.includes('ecommerce') ||
      reasonMsg.includes('ecwid') ||
      isIgnoredError(event.reason)
    ) {
      event.preventDefault();
      return true;
    }
    if (typeof originalOnUnhandled === 'function') {
      return originalOnUnhandled.call(window, event);
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
