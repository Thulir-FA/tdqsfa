import React from 'react';
import type { Invoice, Quotation, CompanySettings } from '../../types';
import { formatCurrency } from '../../utils/export';
import { CompanyLogo } from '../CompanyLogo';
import { X, Printer } from 'lucide-react';

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Invoice | Quotation | null;
  type: 'invoice' | 'quotation';
  companySettings: CompanySettings;
}

export const ViewInvoiceModal: React.FC<ViewInvoiceModalProps> = ({
  isOpen, onClose, document: doc, type, companySettings,
}) => {
  if (!isOpen || !doc) return null;

  const isInvoice = type === 'invoice';
  const inv = isInvoice ? (doc as Invoice) : null;
  const quot = !isInvoice ? (doc as Quotation) : null;

  const docNo = isInvoice ? inv!.invoiceNo : quot!.quotationNo;
  const clientName = isInvoice ? inv!.clientName : quot!.clientName;
  const clientEmail = isInvoice ? inv!.clientEmail : quot!.clientEmail;
  const projectTitle = isInvoice ? inv!.projectTitle : quot!.projectTitle;
  const primaryDate = isInvoice ? inv!.issueDate : quot!.date;
  const secondaryDate = isInvoice ? inv!.dueDate : quot!.validUntil;
  const hasBankDetails = !!(companySettings.bankName && companySettings.iban);

  const disclaimer = isInvoice
    ? 'This is a system-generated Invoice from Thulir Design & QS Services FZE. It is valid without a physical signature or company stamp.'
    : 'This is a system-generated Quotation from Thulir Design & QS Services FZE. It is valid without a physical signature or company stamp.';

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-[220mm] shadow-2xl p-4 relative my-6 text-white print-hide">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase font-bold">{type}</span>
            <span className="text-xs text-zinc-300 font-mono font-bold whitespace-nowrap">{docNo}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handlePrint} className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition-all">
              <Printer className="w-4 h-4" /><span>Print / PDF</span>
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* A4 Paper — disclaimer is INSIDE here */}
        <div className="a4-print-area rounded-lg border border-zinc-200 shadow-lg mt-3 text-zinc-900 font-sans p-8 space-y-5">

          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-zinc-300 pb-5">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <CompanyLogo size="lg" />
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900 leading-tight">{companySettings.companyName}</h2>
                  <p className="text-xs font-medium text-emerald-800">{companySettings.tagline}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">{companySettings.address}</p>
              <p className="text-xs text-zinc-500">{companySettings.email} • Tax ID: {companySettings.taxId}</p>
            </div>
            <div className="text-right ml-6 shrink-0">
              <h1 className="text-3xl font-black uppercase tracking-wider text-emerald-950">{isInvoice ? 'INVOICE' : 'QUOTATION'}</h1>
              <p className="font-mono text-lg font-extrabold text-emerald-700 mt-1 whitespace-nowrap">#{docNo}</p>
              <div className="mt-2 text-xs text-zinc-500 space-y-0.5">
                <p><span className="font-bold">{isInvoice ? 'Issue Date:' : 'Date:'}</span> {primaryDate}</p>
                <p><span className="font-bold">{isInvoice ? 'Due Date:' : 'Valid Until:'}</span> {secondaryDate}</p>
              </div>
            </div>
          </div>

          {/* Client & Project */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Billed To:</p>
              <p className="font-bold text-base text-slate-900 mt-1">{clientName}</p>
              <p className="text-slate-500 text-sm">{clientEmail}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Project / Scope:</p>
              <p className="font-bold text-base text-slate-900 mt-1">{projectTitle}</p>
              <p className="text-slate-500 text-sm capitalize">Department: {doc.deptId}</p>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 uppercase text-xs font-bold">
                <th className="py-2 px-2 w-8">#</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 text-right">Qty</th>
                <th className="py-2 px-3 text-right">Unit Rate</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {doc.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3 px-2 font-mono text-slate-400 text-sm">{idx + 1}</td>
                  <td className="py-3 px-3 font-medium text-slate-900 text-sm">{item.description}</td>
                  <td className="py-3 px-3 text-right font-mono text-sm">{item.quantity} {item.unit}</td>
                  <td className="py-3 px-3 text-right font-mono text-sm">{formatCurrency(item.unitPrice, companySettings)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">{formatCurrency(item.amount, companySettings)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end pt-3 border-t-2 border-slate-300">
            <div className="w-60 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(doc.subtotal, companySettings)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax ({doc.taxRate}%):</span>
                <span className="font-mono">+{formatCurrency(doc.taxAmount, companySettings)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 border-slate-300 pt-2 mt-1">
                <span>Total Amount:</span>
                <span className="text-indigo-900 font-mono text-xl">{formatCurrency(doc.totalAmount, companySettings)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {hasBankDetails && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Bank Details (AED B2B Transfer)</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Bank:</span><span className="text-slate-900 font-semibold">{companySettings.bankName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Account:</span><span className="text-slate-900 font-mono">{companySettings.accountNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">IBAN:</span><span className="text-slate-900 font-mono">{companySettings.iban}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">SWIFT:</span><span className="text-slate-900 font-mono">{companySettings.swiftCode}</span></div>
              </div>
            </div>
          )}

          {/* Notes */}
            <div className="border-t border-slate-200 pt-3 text-sm text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">Notes & Terms:</p>
              {(doc.notes || 'Thank you for your business.').split('\n').filter(l => l.trim() !== '').map((line, i) => (
              <p key={i} className="m-0 leading-relaxed">{line}</p>
              ))}
              {isInvoice && <p>{inv!.paymentTerms}</p>}
              {!isInvoice && <p>{quot!.terms}</p>}
            </div>

          {/* ★ Disclaimer — INSIDE the paper, at the very end ★ */}
          <div className="border-t border-slate-300 pt-4 text-center">
            <p className="text-xs font-semibold italic text-slate-400">{disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
