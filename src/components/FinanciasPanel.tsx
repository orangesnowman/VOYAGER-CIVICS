import React, { useState } from 'react';
import { BusinessAdvisorFrameworkCard } from './BusinessAdvisorFrameworkCard';
import { 
  CreditCard, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  Search, 
  Download, 
  Building, 
  FileText, 
  ShieldAlert, 
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Sparkles,
  PieChart
} from 'lucide-react';

interface FinanciasPanelProps {
  selectedLang: 'EN' | 'ES';
  onNavigateTab?: (tab: string) => void;
}

interface Transaction {
  id: string;
  customer: string;
  email: string;
  plan: string;
  amount: string;
  date: string;
  status: 'completed' | 'pending' | 'refunded';
  gateway: 'Stripe' | 'PayPal' | 'Bank Transfer';
  invoiceRef: string;
}

export const FinanciasPanel: React.FC<FinanciasPanelProps> = ({
  selectedLang,
  onNavigateTab
}) => {
  const isEn = selectedLang === 'EN';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending' | 'refunded'>('all');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  // Sample real-time transaction ledger
  const transactions: Transaction[] = [
    { id: 'tx_1092', customer: 'Carlos Mendoza', email: 'carlos.m@gmail.com', plan: 'Plan Pro Mensual', amount: '$29.99 USD', date: '2026-08-29 14:22', status: 'completed', gateway: 'Stripe', invoiceRef: 'INV-2026-0841' },
    { id: 'tx_1091', customer: 'Escuela San José', email: 'admin@sanjose.edu', plan: 'Institucional (30 Licencias)', amount: '$450.00 USD', date: '2026-08-29 11:05', status: 'completed', gateway: 'Bank Transfer', invoiceRef: 'INV-2026-0840' },
    { id: 'tx_1090', customer: 'María Fernanda Ruiz', email: 'mf.ruiz@hotmail.com', plan: 'Plan Premium Anual', amount: '$199.00 USD', date: '2026-08-28 19:40', status: 'completed', gateway: 'Stripe', invoiceRef: 'INV-2026-0839' },
    { id: 'tx_1089', customer: 'Alejandro Torres', email: 'atorres@tech.co', plan: 'Plan Pro Mensual', amount: '$29.99 USD', date: '2026-08-28 16:15', status: 'completed', gateway: 'PayPal', invoiceRef: 'INV-2026-0838' },
    { id: 'tx_1088', customer: 'Lucía Benítez', email: 'l.benitez@yahoo.es', plan: 'Certificación Cívica 128', amount: '$49.00 USD', date: '2026-08-28 12:02', status: 'refunded', gateway: 'Stripe', invoiceRef: 'INV-2026-0837' },
    { id: 'tx_1087', customer: 'Academia de Idiomas NY', email: 'facturacion@nyidiomas.org', plan: 'Institucional (15 Licencias)', amount: '$225.00 USD', date: '2026-08-27 15:30', status: 'completed', gateway: 'Bank Transfer', invoiceRef: 'INV-2026-0836' },
    { id: 'tx_1086', customer: 'Gabriel Ramos', email: 'gramos99@gmail.com', plan: 'Plan Pro Mensual', amount: '$29.99 USD', date: '2026-08-27 09:10', status: 'pending', gateway: 'Stripe', invoiceRef: 'INV-2026-0835' },
  ];

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = selectedFilter === 'all' || tx.status === selectedFilter;
    const matchesSearch = 
      tx.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.plan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleInstantPayout = () => {
    setIsProcessingPayout(true);
    setTimeout(() => {
      setIsProcessingPayout(false);
      setPayoutSuccessMsg(
        isEn 
          ? 'Transfer of $12,450.00 USD initiated to Chase Business Account ending in •••• 4912.' 
          : 'Transferencia de $12,450.00 USD iniciada a la cuenta Chase Business terminada en •••• 4912.'
      );
      setTimeout(() => setPayoutSuccessMsg(null), 5000);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-5 text-left font-sans animate-fade-in">
      
      {/* HEADER BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#0D224A] text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {isEn ? 'FINANCIAS & AUDIT LEDGER' : 'PANEL DE FINANCIAS Y FACTURACIÓN'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                {isEn ? 'Cash Flow Management, Payment Gateways & Invoicing Operations' : 'Gestión de Flujo de Caja, Pasarelas de Pago y Registro de Transacciones'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isEn ? 'Stripe & Banking Synced' : 'Sincronizado con Stripe & Banco'}</span>
          </span>
        </div>
      </div>

      {/* VOYAGER BUSINESS INTELLIGENCE ADVISOR FRAMEWORK */}
      <BusinessAdvisorFrameworkCard selectedLang={selectedLang} currentTab="financias" onNavigateTab={onNavigateTab} />

      {/* PAYOUT ALERT IF TRIGGERED */}
      {payoutSuccessMsg && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-3 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{payoutSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* CARD 1: AVAILABLE STRIPE BALANCE */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {isEn ? 'AVAILABLE BALANCE (STRIPE)' : 'SALDO DISPONIBLE (STRIPE)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">$12,450.00</span>
            <span className="text-xs font-bold text-emerald-600">USD</span>
          </div>
          <button
            type="button"
            disabled={isProcessingPayout}
            onClick={handleInstantPayout}
            className="w-full mt-2 py-2 px-3 bg-[#0D224A] hover:bg-[#163673] text-emerald-300 rounded-xl text-xs font-black transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessingPayout ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isEn ? 'Processing Payout...' : 'Procesando Retiro...'}</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{isEn ? 'Instant Bank Transfer' : 'Transferir a Banco'}</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 2: PENDING CLEARANCE */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {isEn ? 'PENDING CLEARANCE' : 'EN RETENCIÓN / LIQUIDACIÓN'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">$3,120.00</span>
            <span className="text-xs font-bold text-amber-600">USD</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {isEn ? 'Expected payout date: Monday Aug 31' : 'Fecha estimada de depósito: Lunes 31 Ago'}
          </p>
        </div>

        {/* CARD 3: TOTAL INVOICED MONTHLY */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {isEn ? 'INVOICED THIS MONTH' : 'FACTURADO ESTE MES'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">$18,450.00</span>
            <span className="text-xs font-bold text-blue-600">+14% MoM</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {isEn ? '148 electronic invoices generated' : '148 facturas electrónicas emitidas'}
          </p>
        </div>

        {/* CARD 4: PROCESSING FEES */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {isEn ? 'GATEWAY FEES (AVG 2.8%)' : 'COMISIONES DE PASARELA (2.8%)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">$516.60</span>
            <span className="text-xs font-bold text-purple-600">USD</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {isEn ? 'Stripe 2.9% + $0.30 per charge' : 'Stripe 2.9% + $0.30 por transacción'}
          </p>
        </div>

      </div>

      {/* MIDDLE SECTION: BANK ACCOUNTS & GATEWAY SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* CONNECTED BANK ACCOUNTS */}
        <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-[#0D224A]" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isEn ? 'CONNECTED BANK ACCOUNTS' : 'CUENTAS BANCARIAS VINCULADAS'}
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-xs">
                  CHASE
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Chase Business Checking</h4>
                  <p className="text-[10px] text-slate-500 font-bold">•••• 4912 | USD Primary</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">
                {isEn ? 'Primary' : 'Principal'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                  STRIPE
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Stripe Connect Payouts</h4>
                  <p className="text-[10px] text-slate-500 font-bold">acct_1Nv84920... | Live</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-black">
                {isEn ? 'Active' : 'Activo'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{isEn ? 'Auto-Payout Schedule:' : 'Calendario de Depósitos:'}</span>
            <span className="font-extrabold text-slate-900">{isEn ? 'Every 2 Business Days' : 'Cada 2 Días Hábiles'}</span>
          </div>
        </div>

        {/* TRANSACTIONS SEARCH & FILTERABLE TABLE */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isEn ? 'REGISTRO DE TRANSACCIONES & FACTURAS' : 'REGISTRO DE TRANSACCIONES & FACTURAS'}
              </h3>
            </div>

            {/* STATUS FILTER BUTTONS */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isEn ? 'All' : 'Todos'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('completed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedFilter === 'completed' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isEn ? 'Completed' : 'Completados'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('pending')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedFilter === 'pending' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isEn ? 'Pending' : 'Pendientes'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('refunded')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedFilter === 'refunded' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isEn ? 'Refunds' : 'Reembolsos'}
              </button>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={isEn ? 'Search customer, email, invoice ID or plan...' : 'Buscar cliente, correo, n° factura o plan...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0D224A]"
            />
          </div>

          {/* TABLE OF TRANSACTIONS */}
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2.5">Factura</th>
                  <th className="p-2.5">Cliente</th>
                  <th className="p-2.5">Plan / Concepto</th>
                  <th className="p-2.5">Pasarela</th>
                  <th className="p-2.5">Monto</th>
                  <th className="p-2.5 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold text-[#0D224A]">{tx.invoiceRef}</td>
                    <td className="p-2.5">
                      <div className="font-extrabold text-slate-900">{tx.customer}</div>
                      <div className="text-[10px] text-slate-500">{tx.email}</div>
                    </td>
                    <td className="p-2.5 font-semibold text-slate-700">{tx.plan}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {tx.gateway}
                      </span>
                    </td>
                    <td className="p-2.5 font-black text-slate-900">{tx.amount}</td>
                    <td className="p-2.5 text-right">
                      {tx.status === 'completed' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1">
                          ✓ Paid
                        </span>
                      )}
                      {tx.status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black inline-flex items-center gap-1">
                          ⏱ Pending
                        </span>
                      )}
                      {tx.status === 'refunded' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black inline-flex items-center gap-1">
                          ↩ Refunded
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};
