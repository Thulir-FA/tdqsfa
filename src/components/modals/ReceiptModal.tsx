import React, { useEffect, useState } from "react";
import {
  DepartmentId,
  PaymentMode,
  ReceiptType,
  CompanySettings,
  Invoice,
  VendorContractor,
  Receipt,
} from "../../types";
import { DEPARTMENTS } from "../../data/initialData";
import { X, Receipt as ReceiptIcon } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (receipt: Partial<Receipt>) => void;
  defaultDeptId?: DepartmentId;
  initialInvoice?: Invoice | null;
  companySettings: CompanySettings;
  vendors?: VendorContractor[];
  suggestedNo?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultDeptId = "design",
  initialInvoice = null,
  companySettings,
  vendors = [],
  suggestedNo = "",
}) => {
  const getDefaultDepartment = (): DepartmentId => {
    return defaultDeptId === "all" ? "design" : defaultDeptId;
  };

  const getToday = (): string => {
    return new Date().toISOString().slice(0, 10);
  };

  const generateTransactionRef = (): string => {
    return `TXN-${Math.floor(
      1000000 + Math.random() * 9000000
    )}`;
  };

  const [deptId, setDeptId] = useState<DepartmentId>(
    getDefaultDepartment()
  );

  const [receiptNo, setReceiptNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  const [nameSource, setNameSource] = useState<"vendor" | "custom">(
    "custom"
  );

  const [clientOrVendorName, setClientOrVendorName] = useState("");

  const [type, setType] = useState<ReceiptType>("incoming");

  const [paymentDate, setPaymentDate] = useState(getToday());

  const [paymentMode, setPaymentMode] =
    useState<PaymentMode>("bank_transfer");

  const [referenceNo, setReferenceNo] = useState("");

  const [amount, setAmount] = useState<number>(0);

  const [status, setStatus] = useState<"cleared" | "pending">(
    "cleared"
  );

  const [notes, setNotes] = useState("");

  /*
   * Reset / populate the form whenever the modal opens
   * or the selected invoice changes.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialInvoice) {
      const matchingVendor = vendors.some(
        (vendor) => vendor.name === initialInvoice.clientName
      );

      setDeptId(initialInvoice.deptId);
      setInvoiceNo(initialInvoice.invoiceNo || "");
      setClientOrVendorName(initialInvoice.clientName || "");

      setNameSource(matchingVendor ? "vendor" : "custom");

      setType("incoming");

      const invoiceAmount =
        initialInvoice.balanceDue > 0
          ? initialInvoice.balanceDue
          : initialInvoice.totalAmount;

      setAmount(invoiceAmount || 0);
      setReferenceNo(generateTransactionRef());
      setReceiptNo(suggestedNo || "");
      setPaymentDate(getToday());
      setPaymentMode("bank_transfer");
      setStatus("cleared");
      setNotes(`This receipt confirms payment of ${companySettings.currencySymbol || ''}${invoiceAmount || 0} received against invoice ${initialInvoice.invoiceNo}. Payment mode: Bank Transfer. Please retain this receipt for your records.`);
    } else {
      setDeptId(getDefaultDepartment());
      setReceiptNo(suggestedNo || "");
      setInvoiceNo("");
      setNameSource("custom");
      setClientOrVendorName("");
      setType("incoming");
      setPaymentDate(getToday());
      setPaymentMode("bank_transfer");
      setReferenceNo(generateTransactionRef());
      setAmount(0);
      setStatus("cleared");
      setNotes(`This receipt confirms payment received. Please retain for your records`);
    }
  }, [
    isOpen,
    initialInvoice,
    defaultDeptId,
    suggestedNo,
    vendors,
  ]);

  /*
   * Don't render anything when modal is closed.
   */
  if (!isOpen) {
    return null;
  }

  const handleVendorSelect = (vendorName: string) => {
    setClientOrVendorName(vendorName);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanName = clientOrVendorName.trim();

    if (!cleanName) {
      return;
    }

    if (!amount || amount <= 0) {
      return;
    }

    const receipt: Partial<Receipt> = {
      id: `rec_${Date.now()}`,

      receiptNo: receiptNo.trim(),

      deptId,

      invoiceNo: invoiceNo.trim(),

      clientOrVendorName: cleanName,

      type,

      paymentDate,

      paymentMode,

      referenceNo: referenceNo.trim(),

      amount,

      status,

      notes: notes.trim(),

      createdAt: getToday(),
    };

    onSave(receipt);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-[850px] max-w-[95vw] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="flex items-center space-x-2 text-base font-bold text-white">
            <ReceiptIcon className="h-5 w-5 text-emerald-400" />

            <span>Record Payment Receipt</span>
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 text-xs"
        >
          {/* Department + Payment Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-slate-400">
                Department
              </label>

              <select
                value={deptId}
                onChange={(e) =>
                  setDeptId(e.target.value as DepartmentId)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                {DEPARTMENTS.map((department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-400">
                Payment Type
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as ReceiptType)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="incoming">
                  Incoming (Client Payment)
                </option>

                <option value="outgoing">
                  Outgoing (Vendor Payout)
                </option>
              </select>
            </div>
          </div>

          {/* Client / Vendor */}
          <div>
            <label className="mb-1 block font-semibold text-slate-400">
              Client / Vendor Name *
            </label>

            <select
              value={nameSource}
              onChange={(e) => {
                const value = e.target.value as
                  | "vendor"
                  | "custom";

                setNameSource(value);

                if (value === "custom") {
                  setClientOrVendorName("");
                }
              }}
              className="mb-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="custom">
                -- Type Custom Name --
              </option>

              <option value="vendor">
                -- Select from Vendors/Contractors --
              </option>
            </select>

            {nameSource === "vendor" ? (
              <select
                value={clientOrVendorName}
                onChange={(e) =>
                  handleVendorSelect(e.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Choose vendor...</option>

                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.name}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={clientOrVendorName}
                onChange={(e) =>
                  setClientOrVendorName(e.target.value)
                }
                placeholder="e.g. Metro Transit Corp"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            )}
          </div>

          {/* Receipt + Invoice */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-slate-400">
                Receipt Number
              </label>

              <input
                type="text"
                required
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-400">
                Linked Invoice Ref
              </label>

              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Amount + Payment Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-slate-400">
                Payment Amount (
                {companySettings?.currencySymbol || ""}
                ) *
              </label>

              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono font-bold text-emerald-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-400">
                Payment Mode
              </label>

              <select
                value={paymentMode}
                onChange={(e) =>
                  setPaymentMode(e.target.value as PaymentMode)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="bank_transfer">
                  Bank Wire Transfer
                </option>

                <option value="cheque">Cheque</option>

                <option value="cash">Cash</option>

                <option value="online">Online Payment</option>
              </select>
            </div>
          </div>

          {/* Reference + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-slate-400">
                Bank / Transaction Ref
              </label>

              <input
                type="text"
                value={referenceNo}
                onChange={(e) =>
                  setReferenceNo(e.target.value)
                }
                placeholder="e.g. TXN-99182"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-400">
                Payment Date
              </label>

              <input
                type="date"
                value={paymentDate}
                onChange={(e) =>
                  setPaymentDate(e.target.value)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block font-semibold text-slate-400">
              Payment Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "cleared" | "pending"
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="cleared">Cleared</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block font-semibold text-slate-400">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-slate-300 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-md transition-colors hover:bg-emerald-500"
            >
              Save Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptModal;
