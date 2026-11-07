"use client";

import { useRef } from "react";
import Link from "next/link";
import { 
  Printer, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  Store,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/Price";

export default function PosReceiptModal({
  order,
  onNewSale,
  onClose,
  cashierName = "Cashier",
  storeName = "Store",
  paidAmount = 0,
  changeReturned = 0
}) {
  const receiptRef = useRef(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = new Date(order.createdAt || Date.now()).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border/20 rounded-3xl shadow-2xl p-6 space-y-6 my-auto">
        {/* Top Success Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-border/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
                Sale Completed!
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                Invoice #{order._id?.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 🖨️ Thermal Receipt Printable Container */}
        <div 
          id="pos-receipt-print-area" 
          ref={receiptRef}
          className="bg-white text-black p-6 rounded-2xl shadow-inner border border-gray-200 font-mono text-[11px] leading-tight max-w-[340px] mx-auto space-y-3"
        >
          {/* Store Header */}
          <div className="text-center space-y-1 pb-2 border-b border-dashed border-gray-400">
            <h3 className="text-base font-black uppercase tracking-widest text-black">
              {storeName}
            </h3>
            <p className="text-[10px] text-gray-600 font-sans">
              Retail Outlet & POS Counter
            </p>
            <p className="text-[9px] text-gray-500 font-sans">
              Hotline: +880 1700-000000
            </p>
          </div>

          {/* Metadata */}
          <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-gray-400">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice:</span>
              <span className="font-bold">#{order._id?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span>{formattedDate} {formattedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cashier:</span>
              <span>{cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-bold truncate max-w-[150px]">
                {order.shippingAddress?.name || "Walk-in Customer"}
              </span>
            </div>
            {order.shippingAddress?.phone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span>{order.shippingAddress.phone}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="pb-2 border-b border-dashed border-gray-400">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-gray-300 text-gray-600">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.orderItems?.map((item, idx) => (
                  <tr key={idx} className="py-1">
                    <td className="py-1 font-bold">
                      <div className="truncate max-w-[120px]">{item.name}</div>
                      {item.size && (
                        <div className="text-[8px] text-gray-500 font-normal">
                          Size: {typeof item.size === "object" ? item.size?.name : "Std"}
                        </div>
                      )}
                    </td>
                    <td className="py-1 text-center font-bold">{item.quantity}</td>
                    <td className="py-1 text-right font-price"><Price amount={item.price} /></td>
                    <td className="py-1 text-right font-bold font-price"><Price amount={item.price * item.quantity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="space-y-1 text-[10px] pb-2 border-b border-dashed border-gray-400 font-price">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-bold"><Price amount={order.itemsPrice} /></span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between items-center text-gray-700">
                <span>Discount:</span>
                <span className="inline-flex items-baseline gap-0.5">
                  <span>-</span>
                  <Price amount={order.discountAmount} />
                </span>
              </div>
            )}
            {order.shippingPrice > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivery Charge:</span>
                <span><Price amount={order.shippingPrice} /></span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs font-black pt-1 border-t border-gray-300">
              <span>Net Payable:</span>
              <span><Price amount={order.totalPrice} /></span>
            </div>
          </div>

          {/* Settlement Details */}
          <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-gray-400 font-price">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-sans">Payment Method:</span>
              <span className="font-bold font-sans">{order.paymentMethod || "Cash"}</span>
            </div>
            {order.paymentResult?.transactionId && !order.paymentResult.transactionId.startsWith("POS-") && (
              <div className="flex justify-between items-center text-gray-700">
                <span className="font-sans">TrxID / Reference:</span>
                <span className="font-mono font-bold">{order.paymentResult.transactionId}</span>
              </div>
            )}
            {paidAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-sans">Amount Tendered (প্রদত্ত):</span>
                <span><Price amount={paidAmount} /></span>
              </div>
            )}
            {changeReturned > 0 && (
              <div className="flex justify-between items-center font-bold text-gray-900">
                <span className="font-sans">Change Returned (ফেরত):</span>
                <span><Price amount={changeReturned} /></span>
              </div>
            )}
          </div>

          {/* Remarks / Special Note */}
          {order.note && (
            <div className="text-[9px] text-gray-700 italic pb-2 border-b border-dashed border-gray-400">
              <span className="font-bold not-italic">Note: </span>
              <span>{order.note}</span>
            </div>
          )}

          {/* Receipt Footer */}
          <div className="text-center pt-1 text-[8px] text-gray-500 font-sans space-y-0.5">
            <p className="font-bold">Thank You For Your Purchase!</p>
            <p>Exchange within 7 days with invoice slip.</p>
            <p className="text-[7px] text-gray-400 pt-1">Powered by {storeName} POS</p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="button"
            onClick={handlePrint}
            className="w-full sm:flex-1 h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black text-xs uppercase tracking-widest gap-2"
          >
            <Printer size={16} />
            Print Receipt
          </Button>

          <Button
            type="button"
            onClick={onNewSale}
            className="w-full sm:flex-1 h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black text-xs uppercase tracking-widest gap-2"
          >
            <RotateCcw size={16} />
            New Sale (পরবর্তী গ্রাহক)
          </Button>

          <Link
            href={`/admin/orders/${order._id}`}
            className="w-full sm:w-auto h-12 px-4 rounded-2xl bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center text-xs font-black uppercase tracking-wider gap-1.5 transition-colors border border-border/20"
          >
            <ExternalLink size={14} />
            <span>Order</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

