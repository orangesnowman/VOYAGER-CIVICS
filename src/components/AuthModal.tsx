import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLang: 'EN' | 'ES';
  onEmailAuthSubmit: (e: React.FormEvent, isRegister: boolean, name: string, email: string, pass: string) => void;
  onGoogleLogin: () => void;
  onGuestLogin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  selectedLang,
  onEmailAuthSubmit,
  onGoogleLogin,
  onGuestLogin,
}) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName} ${lastName}`.trim();
    onEmailAuthSubmit(e, isRegister, fullName, email, password);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-neutral-100 w-full max-w-sm p-6 sm:p-8 relative overflow-hidden animate-scale-up">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-800 transition-colors p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-start text-left w-full">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A365D] tracking-tight leading-tight mb-3">
            {selectedLang === 'EN' ? 'Sign In' : 'Iniciar Sesión'}
          </h2>
          
          <p className="text-sm sm:text-base text-neutral-800 font-medium leading-snug mb-6">
            {selectedLang === 'EN' 
              ? 'Use your Google account, your email address or enter as a guest.' 
              : 'Utiliza tu cuenta de Google, tu correo electronico o entra como invitado.'}
          </p>

          <div className="flex items-center gap-4">
            {/* Google */}
            <button 
              type="button"
              onClick={() => {
                onClose();
                onGoogleLogin();
              }}
              title={selectedLang === 'EN' ? 'Google Sign In' : 'Iniciar con Google'}
              className="w-12 h-12 rounded-full border-[2.5px] border-black bg-white hover:bg-neutral-50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-xs"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </button>

            {/* Email */}
            <button 
              type="button"
              onClick={() => setShowEmailForm(!showEmailForm)}
              title={selectedLang === 'EN' ? 'Sign in with Email' : 'Iniciar con Correo'}
              className={`w-12 h-12 rounded-full border-[2.5px] ${showEmailForm ? 'border-[#1A365D] bg-neutral-100 ring-2 ring-[#1A365D]/20' : 'border-black bg-white'} hover:bg-neutral-50 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs`}
            >
              <svg className="w-6 h-6 text-[#1A365D]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </button>

            {/* Guest */}
            <button 
              type="button"
              onClick={() => {
                onClose();
                onGuestLogin();
              }}
              title={selectedLang === 'EN' ? 'Enter as Guest' : 'Entrar como Invitado'}
              className="w-12 h-12 rounded-full border-[2.5px] border-black bg-white hover:bg-neutral-50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-xs"
            >
              <svg className="w-6 h-6 text-[#1A365D]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
              </svg>
            </button>
          </div>

          {/* Expandable Email Form */}
          {showEmailForm && (
            <div className="w-full pt-4 mt-4 border-t border-neutral-200 animate-fade-in">
              <div className="flex bg-neutral-100 p-1 rounded-xl mb-3">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !isRegister 
                      ? 'bg-white text-[#1A365D] shadow-xs' 
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {selectedLang === 'EN' ? 'Sign In' : 'Iniciar Sesión'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isRegister 
                      ? 'bg-white text-[#1A365D] shadow-xs' 
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {selectedLang === 'EN' ? 'Create Account' : 'Crear Cuenta'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {isRegister && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-neutral-700 uppercase tracking-wider mb-1">
                        {selectedLang === 'EN' ? 'First Name' : 'Primer Nombre'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={selectedLang === 'EN' ? 'e.g. Maria' : 'ej. María'}
                        className="w-full px-3 py-2 border-2 border-[#1A365D] rounded-full text-xs font-bold bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-neutral-700 uppercase tracking-wider mb-1">
                        {selectedLang === 'EN' ? 'Last Name' : 'Apellido'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={selectedLang === 'EN' ? 'e.g. Gonzalez' : 'ej. González'}
                        className="w-full px-3 py-2 border-2 border-[#1A365D] rounded-full text-xs font-bold bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-extrabold text-neutral-700 uppercase tracking-wider mb-1">
                    {selectedLang === 'EN' ? 'Email Address' : 'Correo Electrónico'}
                  </label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border-2 border-[#1A365D] rounded-full text-xs font-bold bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-neutral-700 uppercase tracking-wider mb-1">
                    {selectedLang === 'EN' ? 'Password' : 'Contraseña'}
                  </label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border-2 border-[#1A365D] rounded-full text-xs font-bold bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 border-2 border-[#1A365D] bg-[#1A365D] hover:bg-[#152e50] text-white font-bold text-xs rounded-full transition-all shadow-2xs cursor-pointer active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                >
                  {isRegister 
                    ? (selectedLang === 'EN' ? 'Create Account' : 'Crear Cuenta')
                    : (selectedLang === 'EN' ? 'Sign In' : 'Iniciar Sesión')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

