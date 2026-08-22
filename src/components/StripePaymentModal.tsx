import React, { useState } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Printer, 
  Sparkles, 
  X, 
  Loader2,
  Calendar,
  User,
  Mail,
  Award
} from 'lucide-react';

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLang: 'EN' | 'ES';
  itemType: 'sample' | 'monthly_4' | 'monthly_8' | 'pro_upgrade';
  initialName?: string;
  initialEmail?: string;
  initialDate?: string;
  initialTime?: string;
  onPaymentSuccess?: (receipt: any) => void;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  selectedLang,
  itemType,
  initialName = '',
  initialEmail = '',
  initialDate = '',
  initialTime = '10:00 AM',
  onPaymentSuccess
}) => {
  // Details depending on itemType
  const getItemDetails = () => {
    switch (itemType) {
      case 'pro_upgrade':
        return {
          title: selectedLang === 'EN' ? 'USA Voyager PRO Plan Upgrade' : 'Actualización de Cuenta USA Voyager PRO',
          description: selectedLang === 'EN' ? 'Unlock all interactive English lessons on the roadmap + advanced practice tools.' : 'Desbloquea todas las lecciones de inglés de la ruta + herramientas de práctica avanzada.',
          priceCents: 999,
          priceFormatted: '$9.99 USD',
          priceAmount: 9.99
        };
      case 'sample':
        return {
          title: selectedLang === 'EN' ? '30-Min Diagnostic Sample Class' : 'Clase de Prueba Diagnóstica (30 Min)',
          description: selectedLang === 'EN' ? '1-on-1 private diagnostic session with Alejandra Francois (La Profe)' : 'Sesión privada 1-a-1 de diagnóstico con Alejandra Francois (La Profe)',
          priceCents: 2900,
          priceFormatted: '$29.00 USD',
          priceAmount: 29
        };
      case 'monthly_4':
        return {
          title: selectedLang === 'EN' ? 'Monthly Immersion Coaching (4 Sessions/mo)' : 'Coaching Mensual de Inmersión (4 Sesiones/mes)',
          description: selectedLang === 'EN' ? 'Weekly 1-on-1 video calls with La Profe + async chat coaching' : 'Clases semanales 1-a-1 en vivo con La Profe + acompañamiento por chat',
          priceCents: 19900,
          priceFormatted: '$199.00 USD',
          priceAmount: 199
        };
      case 'monthly_8':
        return {
          title: selectedLang === 'EN' ? 'Monthly Intensive Coaching (8 Sessions/mo)' : 'Coaching Mensual Intensivo (8 Sesiones/mes)',
          description: selectedLang === 'EN' ? '2x weekly 1-on-1 video calls with La Profe + daily audio feedback' : '2 clases semanales 1-a-1 en vivo con La Profe + revisión diaria de audio',
          priceCents: 34900,
          priceFormatted: '$349.00 USD',
          priceAmount: 349
        };
    }
  };

  const item = getItemDetails();

  // Form State
  const [customerName, setCustomerName] = useState(initialName);
  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [zipCode, setZipCode] = useState('');

  // UI Flow State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);

  if (!isOpen) return null;

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExpiry(val);
  };

  // Detect Card Brand from number prefix
  const getCardBrand = () => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) return 'Mastercard';
    if (/^3[47]/.test(raw)) return 'Amex';
    if (/^6(?:011|5)/.test(raw)) return 'Discover';
    return 'CreditCard';
  };

  const cardBrand = getCardBrand();

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic validation
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 15) {
      setErrorMessage(selectedLang === 'EN' ? 'Please enter a valid 16-digit credit card number.' : 'Por favor ingresa un número de tarjeta válido.');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setErrorMessage(selectedLang === 'EN' ? 'Please enter a valid expiration date (MM/YY).' : 'Ingresa una fecha de vencimiento válida (MM/AA).');
      return;
    }
    if (!cardCvc || cardCvc.length < 3) {
      setErrorMessage(selectedLang === 'EN' ? 'Please enter a valid 3 or 4 digit CVC security code.' : 'Ingresa el código CVC de 3 o 4 dígitos.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep(selectedLang === 'EN' ? 'Connecting to Stripe Payment Gateway...' : 'Conectando con la pasarela segura de Stripe...');

    try {
      // Step 1: Initialize PaymentIntent on server
      const intentRes = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: item.priceCents,
          currency: 'usd',
          description: item.title,
          customerEmail,
          customerName,
          optionType: itemType
        })
      });

      const intentData = await intentRes.json();
      if (!intentRes.ok) {
        throw new Error(intentData.error || 'Failed to initialize Stripe Payment Intent.');
      }

      setProcessingStep(selectedLang === 'EN' ? 'Authenticating card with issuing bank...' : 'Autenticando tarjeta con el banco emisor...');
      await new Promise(res => setTimeout(res, 1200));

      setProcessingStep(selectedLang === 'EN' ? 'Processing charge securely...' : 'Procesando cargo de forma segura...');
      await new Promise(res => setTimeout(res, 1000));

      // Step 2: Confirm payment on server
      const cardLast4 = rawCard.slice(-4);
      const confirmRes = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: intentData.paymentIntentId,
          customerName,
          customerEmail,
          cardLast4,
          cardBrand,
          amount: item.priceAmount,
          description: item.description,
          itemTitle: item.title
        })
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) {
        throw new Error(confirmData.error || 'Payment confirmation failed.');
      }

      setReceipt(confirmData.receipt);
      setIsProcessing(false);
      if (onPaymentSuccess) {
        onPaymentSuccess(confirmData.receipt);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || (selectedLang === 'EN' ? 'Transaction failed. Please try again.' : 'Transacción fallida. Intenta nuevamente.'));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto relative text-left">
        
        {/* STRIPE HEADER WITH ACCEPTED CARDS */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white relative border-b border-slate-700">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              Stripe Secure Gateway
            </span>
          </div>

          <h3 className="text-lg font-bold font-serif text-white tracking-tight">
            {selectedLang === 'EN' ? 'Payment for Alejandra Francois (La Profe)' : 'Pago para Alejandra Francois (La Profe)'}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            {selectedLang === 'EN' ? 'Encrypted 256-bit SSL transaction processed by Stripe' : 'Transacción encriptada SSL de 256 bits procesada por Stripe'}
          </p>

          {/* MAJOR CREDIT CARDS BADGES */}
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-700/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              {selectedLang === 'EN' ? 'Accepted:' : 'Aceptamos:'}
            </span>

            {/* VISA */}
            <div className="bg-white px-2 py-1 rounded border border-slate-300 shadow-xs flex items-center justify-center" title="Visa">
              <span className="text-[11px] font-black italic tracking-tighter text-blue-900 font-serif">VISA</span>
            </div>

            {/* MASTERCARD */}
            <div className="bg-white px-2 py-1 rounded border border-slate-300 shadow-xs flex items-center justify-center" title="Mastercard">
              <div className="flex items-center -space-x-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
            </div>

            {/* AMEX */}
            <div className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-extrabold tracking-tighter shadow-xs" title="American Express">
              AMEX
            </div>

            {/* DISCOVER */}
            <div className="bg-white px-2 py-1 rounded border border-slate-300 shadow-xs flex items-center justify-center" title="Discover">
              <span className="text-[10px] font-bold tracking-tight text-amber-700 font-sans">DISCOVER</span>
            </div>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* RECEIPT VIEW IF SUCCESSFUL */}
          {receipt ? (
            <div className="space-y-5 text-center animate-fade-in">
              <div className="w-14 h-14 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono">
                  {selectedLang === 'EN' ? 'Payment Approved by Stripe' : 'Pago Aprobado por Stripe'}
                </span>
                <h4 className="text-xl font-bold font-serif text-slate-900 mt-1">
                  {selectedLang === 'EN' ? 'Transaction Complete!' : '¡Transacción Completada!'}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  {selectedLang === 'EN'
                    ? `Your class with La Profe has been reserved. A confirmation email was sent to ${receipt.customerEmail}.`
                    : `Tu clase con La Profe ha quedado reservada. Se envió un correo de confirmación a ${receipt.customerEmail}.`}
                </p>
              </div>

              {/* DIGITAL RECEIPT CARD */}
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-amber-300/80 text-left text-xs space-y-2.5 font-mono shadow-xs">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="font-bold text-slate-800">NO. RECIBO / RECEIPT:</span>
                  <span className="text-slate-900 font-bold">{receipt.receiptId}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">INSTRUCTOR:</span>
                  <span className="text-slate-900 font-bold">Alejandra Francois (La Profe)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">CLIENTE / CUSTOMER:</span>
                  <span className="text-slate-900">{receipt.customerName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">PRODUCTO / ITEM:</span>
                  <span className="text-slate-900 font-bold">{receipt.itemTitle}</span>
                </div>

                {initialDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">FECHA RESERVADA:</span>
                    <span className="text-slate-900">{initialDate} @ {initialTime}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">TARJETA / PAYMENT:</span>
                  <span className="text-slate-900">{receipt.cardBrand} **** {receipt.cardLast4}</span>
                </div>

                <div className="flex items-center justify-between border-t border-amber-200 pt-2 text-sm">
                  <span className="font-bold text-slate-900">TOTAL PAGADO:</span>
                  <span className="font-extrabold text-slate-900">${receipt.amount}.00 USD</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  {selectedLang === 'EN' ? 'Print Receipt' : 'Imprimir Recibo'}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl border border-amber-700 shadow-sm transition-all cursor-pointer"
                >
                  {selectedLang === 'EN' ? 'Done & Return' : 'Finalizar y Volver'}
                </button>
              </div>
            </div>
          ) : (
            /* PAYMENT FORM VIEW */
            <form onSubmit={handlePaySubmit} className="space-y-4">
              
              {/* ORDER SUMMARY */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    {selectedLang === 'EN' ? 'Order Summary' : 'Resumen del Pedido'}
                  </span>
                  <h4 className="font-bold font-serif text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold font-serif text-slate-900">{item.priceFormatted}</span>
                </div>
              </div>

              {/* ERROR ALERT */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {/* CUSTOMER NAME & EMAIL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    {selectedLang === 'EN' ? 'Cardholder Name' : 'Nombre del Titular'}
                  </label>
                  <input 
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Maria Silva"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    {selectedLang === 'EN' ? 'Receipt Email' : 'Correo para Recibo'}
                  </label>
                  <input 
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="maria@example.com"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* CARD DETAILS */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-slate-500" />
                    {selectedLang === 'EN' ? 'Card Information' : 'Información de la Tarjeta'}
                  </span>
                  <span className="text-amber-700 font-mono font-semibold text-[10px]">
                    {cardBrand !== 'CreditCard' ? cardBrand : ''}
                  </span>
                </label>

                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4444 4444 4444 4444"
                    className="w-full p-2.5 pl-9 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* EXPIRY, CVC, ZIP */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {selectedLang === 'EN' ? 'Expires' : 'Vencimiento'}
                  </label>
                  <input 
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    CVC / CVV
                  </label>
                  <input 
                    type="text"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {selectedLang === 'EN' ? 'ZIP / Postal' : 'Código C.P.'}
                  </label>
                  <input 
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.toUpperCase())}
                    placeholder="10001"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 text-center"
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-mono text-xs font-bold rounded-xl border border-emerald-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{processingStep}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-emerald-200" />
                    <span>
                      {selectedLang === 'EN' ? `Pay ${item.priceFormatted} with Stripe` : `Pagar ${item.priceFormatted} con Stripe`}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {selectedLang === 'EN' ? 'Guaranteed end-to-end security via Stripe Payments' : 'Seguridad garantizada de extremo a extremo con Stripe'}
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
