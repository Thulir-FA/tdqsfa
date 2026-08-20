import React, { useState, useEffect } from 'react';
import type { Quotation, DepartmentId, LineItem, QuotationStatus, CompanySettings, VendorContractor } from '../../types';
import { DEPARTMENTS } from '../../data/initialData';
import { formatCurrency } from '../../utils/export';
import { X, FileText, Plus, Trash2 } from 'lucide-react';

const UNIT_OPTIONS = ['Lump Sum', 'Sheet', 'Ton', 'Package', 'Other'];
const VALIDITY_OPTIONS = [7, 15, 30];

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quotation: Partial<Quotation>) => void;
  initialData?: Quotation | null;
  defaultDeptId?: DepartmentId;
  companySettings: CompanySettings;
  vendors?: VendorContractor[];
  suggestedNo?: string;
  onSaveModified?: (quotation: Partial<Quotation>) => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen, onClose, onSave, initialData, defaultDeptId = 'design',
  companySettings, vendors = [], suggestedNo = '', onSaveModified,
}) => {
  const [deptId, setDeptId] = useState<DepartmentId>(defaultDeptId === 'all' ? 'design' : defaultDeptId);
  const [quotationNo, setQuotationNo] = useState('');
  const [clientSource, setClientSource] = useState<'vendor' | 'custom'>('custom');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [date, setDate] = useState('');
  const [validityDays, setValidityDays] = useState<number>(30);
  const [validUntil, setValidUntil] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('draft');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [customUnit, setCustomUnit] = useState('');

  const [items, setItems] = useState<LineItem[]>([
    { id: 'item_1', description: '', quantity: 1, unit: 'Lump Sum', unitPrice: 0, amount: 0 },
  ]);

  // Tax locked from admin settings
  const taxRate = companySettings.defaultTaxRate || 0;

  useEffect(() => {
    if (date) {
      const d = new Date(date);
      d.setDate(d.getDate() + validityDays);
      setValidUntil(d.toISOString().slice(0, 10));
    }
  }, [date, validityDays]);

  useEffect(() => {
    if (initialData) {
      setDeptId(initialData.deptId);
      setQuotationNo(initialData.quotationNo);
      setClientName(initialData.clientName);
      setClientEmail(initialData.clientEmail);
      setProjectTitle(initialData.projectTitle);
      setDate(initialData.date);
      setValidUntil(initialData.validUntil);
      if (initialData.date && initialData.validUntil) {
        const diff = Math.round((new Date(initialData.validUntil).getTime() - new Date(initialData.date).getTime()) / (1000 * 60 * 60 * 24));
        setValidityDays(VALIDITY_OPTIONS.includes(diff) ? diff : 30);
      }
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
      setTerms(initialData.terms || '');
      setItems(initialData.items && initialData.items.length > 0 ? initialData.items : []);
      setClientSource(vendors.find((v) => v.name === initialData.clientName) ? 'vendor' : 'custom');
    } else {
      const selectedDept = defaultDeptId === 'all' ? 'design' : defaultDeptId;
      setDeptId(selectedDept);
      setQuotationNo(suggestedNo || '');
      setClientName(''); setClientEmail(''); setProjectTitle('');
      setDate(new Date().toISOString().slice(0, 10));
      setValidityDays(30);
      setStatus('draft');
      setNotes('Thank you for your interest in our services. This estimate is prepared based on the scope described above and is valid for the period specified. Any variation in scope may affect the pricing.');
      setTerms('No VAT is applicable. Any scope added above the scope mentioned in this quotation will be charged separately after mutual agreement.');
      setClientSource('custom');
      setItems([{ id: `li_${Date.now()}`, description: '', quantity: 1, unit: 'Lump Sum', unitPrice: 0, amount: 0 }]);
    }
  }, [initialData, defaultDeptId, isOpen, suggestedNo, vendors]);

  if (!isOpen) return null;

  const handleVendorSelect = (vendorName: string) => {
    const v = vendors.find((ven) => ven.name === vendorName);
    setClientName(vendorName);
    if (v) setClientEmail(v.email);
  };

  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      item.amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }
    if (field === 'unit' && val !== 'Other') setCustomUnit('');
    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { id: `li_${Date.now()}_${items.length}`, description: '', quantity: 1, unit: 'Lump Sum', unitPrice: 0, amount: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.amount || 0), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim() || !clientName.trim()) return;
    onSave({
      id: initialData ? initialData.id : `q_${Date.now()}`,
      quotationNo, deptId, clientName, clientEmail, projectTitle, date, validUntil, status,
      items, subtotal, taxRate, taxAmount, discount: 0, totalAmount, notes, terms,
      createdAt: initialData ? initialData.createdAt : new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-[850px] max-w-[95vw] shadow-2xl p-6 relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>{initialData ? 'Edit Quotation' : 'Create Quotation'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Department</label>
              <select value={deptId} onChange={(e) => setDeptId(e.target.value as DepartmentId)} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white">
                {DEPARTMENTS.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Quotation Number</label>
              <input type="text" required value={quotationNo} onChange={(e) => setQuotationNo(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-mono" />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as QuotationStatus)} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white">
                <option value="draft">Draft</option><option value="sent">Sent</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Client / Company Name *</label>
              <select value={clientSource} onChange={(e) => { setClientSource(e.target.value as 'vendor' | 'custom'); if (e.target.value === 'custom') { setClientName(''); setClientEmail(''); } }} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white mb-2">
                <option value="custom">-- Type Custom Name --</option><option value="vendor">-- Select from Vendors/Contractors --</option>
              </select>
              {clientSource === 'vendor' ? (
                <select value={clientName} onChange={(e) => handleVendorSelect(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white">
                  <option value="">Choose vendor...</option>
                  {vendors.map((v) => (<option key={v.id} value={v.name}>{v.name} ({v.code})</option>))}
                </select>
              ) : (
                <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Skyline Construction Group" className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white" />
              )}
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Client Email</label>
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="billing@client.com" className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white mt-7" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Project Title / Scope *</label>
            <input type="text" required value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g. Commercial Tower B Rebar Detailing" className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Quotation Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Validity</label>
              <div className="flex items-center space-x-2">
                <select value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white">
                  {VALIDITY_OPTIONS.map((d) => (<option key={d} value={d}>{d} Days</option>))}
                </select>
                <input type="text" readOnly value={validUntil} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase text-indigo-400 tracking-wider">Itemized Scope & Pricing</label>
              <button type="button" onClick={addItemRow} className="flex items-center space-x-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-800 px-2.5 py-1 rounded-lg">
                <Plus className="w-3.5 h-3.5" /><span>Add Item</span>
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                  <div className="col-span-5">
                    <input type="text" placeholder="Item description" value={item.description} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white" />
                  </div>
                  <div className="col-span-1">
                    <input type="number" placeholder="Qty" min="1" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-right" />
                  </div>
                  <div className="col-span-2">
                    {item.unit === 'Other' ? (
                      <input type="text" placeholder="Unit" value={customUnit} onChange={(e) => { setCustomUnit(e.target.value); handleItemChange(idx, 'unit', e.target.value); }} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white" />
                    ) : (
                      <select value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1.5 text-white">
                        {UNIT_OPTIONS.map((u) => (<option key={u} value={u}>{u}</option>))}
                      </select>
                    )}
                  </div>
                  <div className="col-span-3">
                    <input type="number" placeholder="Rate" value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-right font-mono" />
                  </div>
                  <div className="col-span-1 text-center">
                    <button type="button" onClick={() => removeItemRow(idx)} className="text-slate-500 hover:text-rose-400 transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals — no discount */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-mono text-white font-bold">{formatCurrency(subtotal, companySettings)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Tax ({taxRate}%):</span>
              <span className="font-mono text-slate-300">+{formatCurrency(taxAmount, companySettings)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-800 text-white">
              <span>Total Quotation Amount:</span>
              <span className="text-emerald-400 text-base">{formatCurrency(totalAmount, companySettings)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl">Cancel</button>
            {initialData && onSaveModified && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!projectTitle.trim() || !clientName.trim()) return;
                  onSaveModified({
                    id: initialData.id,
                    quotationNo: initialData.quotationNo,
                    deptId, clientName, clientEmail, projectTitle, date, validUntil, status,
                    items, subtotal, taxRate, taxAmount, discount: 0, totalAmount, notes, terms,
                    createdAt: initialData.createdAt,
                  });
                  onClose();
                }}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md"
              >
                Save as Modified
              </button>
            )}
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md">{initialData ? 'Update' : 'Save Quotation'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
