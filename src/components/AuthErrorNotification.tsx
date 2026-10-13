import React from 'react';
import { AlertTriangle, RefreshCw, X, ShieldAlert, Globe, Key, WifiOff } from 'lucide-react';

export interface AuthErrorNotificationProps {
  error: string | any;
  onRetry?: () => void;
  onClear?: () => void;
  selectedLang?: 'EN' | 'ES';
}

export function parseAuthError(rawError: string | any, lang: string = 'ES'): {
  code: string;
  title: string;
  message: string;
  guideSteps?: string[];
  isConfigError: boolean;
  domainUrl?: string;
} {
  const selectedLangNorm: 'EN' | 'ES' = (lang === 'EN' || lang === 'en') ? 'EN' : 'ES';
  const errorStr = typeof rawError === 'string' ? rawError : (rawError?.message || rawError?.code || JSON.stringify(rawError || ''));
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'ais-dev-...';

  // Extract domain from error message if available (e.g. referer error)
  let extractedDomain = currentDomain;
  const domainMatch = errorStr.match(/https?:\/\/([^\/\s]+)/i);
  if (domainMatch && domainMatch[1]) {
    extractedDomain = domainMatch[1];
  }

  // 1. Unauthorized Domain Error
  if (errorStr.includes('auth/unauthorized-domain') || errorStr.includes('unauthorized-domain')) {
    return {
      code: 'auth/unauthorized-domain',
      title: selectedLangNorm === 'EN' ? 'Domain Authorization Required' : 'Dominio no Autorizado en Firebase',
      message: selectedLangNorm === 'EN'
        ? `The domain "${extractedDomain}" is not in the authorized domains list for Firebase Authentication.`
        : `El dominio "${extractedDomain}" no está registrado en la lista de dominios autorizados de Firebase Authentication.`,
      guideSteps: selectedLangNorm === 'EN'
        ? [
            `Go to Firebase Console > Authentication > Settings > Authorized domains.`,
            `Click "Add domain" and enter: ${extractedDomain}`,
            `Save and click "Retry Sign In" below.`
          ]
        : [
            `Ir a Consola de Firebase > Authentication > Configuración > Dominios autorizados.`,
            `Hacer clic en "Agregar dominio" e ingresar: ${extractedDomain}`,
            `Guardar y presionar "Reintentar Inicio de Sesión" abajo.`
          ],
      isConfigError: true,
      domainUrl: extractedDomain
    };
  }

  // 2. Referer Policy / Restricted Key Error
  if (errorStr.includes('requests-from-referer') || errorStr.includes('referer') || errorStr.includes('blocked')) {
    return {
      code: 'auth/requests-from-referer-blocked',
      title: selectedLangNorm === 'EN' ? 'Google API Key Restriction Block' : 'Restricción de Referer en Clave API',
      message: selectedLangNorm === 'EN'
        ? `Google Cloud is blocking authentication requests coming from ${extractedDomain}.`
        : `Google Cloud está bloqueando las solicitudes de autenticación provenientes de ${extractedDomain}.`,
      guideSteps: selectedLangNorm === 'EN'
        ? [
            `Open Google Cloud Console > APIs & Services > Credentials.`,
            `Select your Firebase Web API Key.`,
            `Under Application Restrictions, add https://${extractedDomain}/* to Website Restrictions or set to "None".`
          ]
        : [
            `Abrir Google Cloud Console > APIs y Servicios > Credenciales.`,
            `Seleccionar la clave de API de Firebase Web.`,
            `En Restricciones de Aplicación, agregar https://${extractedDomain}/* a los referers de sitios web o seleccionar "Ninguna".`
          ],
      isConfigError: true,
      domainUrl: extractedDomain
    };
  }

  // 3. Network Failure
  if (errorStr.includes('auth/network-request-failed') || errorStr.includes('network-request-failed')) {
    return {
      code: 'auth/network-request-failed',
      title: selectedLangNorm === 'EN' ? 'Network Connection Lost' : 'Error de Conexión de Red',
      message: selectedLangNorm === 'EN'
        ? 'Unable to reach the authentication servers. Please check your internet connection.'
        : 'No se pudo conectar con los servidores de autenticación. Verifica tu conexión a internet.',
      isConfigError: false
    };
  }

  // 4. Invalid Credentials
  if (
    errorStr.includes('auth/wrong-password') ||
    errorStr.includes('auth/user-not-found') ||
    errorStr.includes('auth/invalid-credential') ||
    errorStr.includes('Invalid email or password')
  ) {
    return {
      code: 'auth/invalid-credential',
      title: selectedLangNorm === 'EN' ? 'Invalid Credentials' : 'Credenciales Incorrectas',
      message: selectedLangNorm === 'EN'
        ? 'The email or password entered is incorrect. Please try again.'
        : 'El correo electrónico o la contraseña son incorrectos. Intenta de nuevo.',
      isConfigError: false
    };
  }

  // 5. Email Already in Use
  if (errorStr.includes('auth/email-already-in-use') || errorStr.includes('Email already registered')) {
    return {
      code: 'auth/email-already-in-use',
      title: selectedLangNorm === 'EN' ? 'Email Already Registered' : 'Correo Ya Registrado',
      message: selectedLangNorm === 'EN'
        ? 'This email address is already associated with an account. Please sign in instead.'
        : 'Este correo electrónico ya está registrado. Intenta iniciar sesión con tu contraseña.',
      isConfigError: false
    };
  }

  // Fallback / General Error
  return {
    code: 'general_error',
    title: selectedLangNorm === 'EN' ? 'Authentication Notice' : 'Aviso de Autenticación',
    message: errorStr.replace(/^Sign in error:\s*/i, '').replace(/^Google login error:\s*/i, '').replace(/^Firebase:\s*/i, ''),
    isConfigError: false
  };
}

export const AuthErrorNotification: React.FC<AuthErrorNotificationProps> = ({
  error,
  onRetry,
  onClear,
  selectedLang = 'ES'
}) => {
  if (!error) return null;

  const details = parseAuthError(error, selectedLang);

  return (
    <div className="w-full my-3 p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-2xl shadow-sm text-xs transition-all animate-fade-in relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 text-amber-700 rounded-xl shrink-0 mt-0.5">
          {details.code === 'auth/unauthorized-domain' ? (
            <Globe className="w-4 h-4 text-amber-600 animate-pulse" />
          ) : details.code === 'auth/requests-from-referer-blocked' ? (
            <Key className="w-4 h-4 text-amber-600 animate-pulse" />
          ) : details.code === 'auth/network-request-failed' ? (
            <WifiOff className="w-4 h-4 text-amber-600" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-amber-900 text-xs sm:text-sm tracking-wide">
              {details.title}
            </h4>
            {details.isConfigError && (
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 rounded font-mono">
                {selectedLang === 'EN' ? 'Setup Step' : 'Configuración'}
              </span>
            )}
          </div>

          <p className="text-amber-800/90 text-xs leading-relaxed font-medium mb-2">
            {details.message}
          </p>

          {/* Setup Guide Steps for Admin / Developers */}
          {details.guideSteps && details.guideSteps.length > 0 && (
            <div className="my-2 p-2.5 bg-white/70 border border-amber-300/60 rounded-xl text-[11px] text-neutral-800 space-y-1">
              <div className="font-bold text-amber-900 text-[10px] uppercase tracking-wider mb-1 font-mono">
                {selectedLang === 'EN' ? 'How to resolve:' : 'Cómo resolverlo:'}
              </div>
              <ol className="list-decimal list-inside space-y-1 font-mono text-[10.5px]">
                {details.guideSteps.map((step, idx) => (
                  <li key={idx} className="leading-snug">
                    <span className="font-sans font-medium text-neutral-800">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-2 mt-2 pt-1 border-t border-amber-500/20">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 animate-spin-hover" />
                <span>{selectedLang === 'EN' ? 'Retry Request' : 'Reintentar Solicitud'}</span>
              </button>
            )}

            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="px-2.5 py-1.5 text-amber-800 hover:text-amber-950 font-semibold text-[11px] rounded-lg hover:bg-amber-500/10 transition-all cursor-pointer"
              >
                {selectedLang === 'EN' ? 'Dismiss' : 'Descartar'}
              </button>
            )}
          </div>
        </div>

        {/* Clear Cross Button top right */}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2.5 right-2.5 p-1 text-amber-700 hover:text-amber-950 rounded-lg hover:bg-amber-500/20 transition-all"
            title={selectedLang === 'EN' ? 'Close' : 'Cerrar'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
