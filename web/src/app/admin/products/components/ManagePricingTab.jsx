"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { swalToast, swalError } from "@/utils/swal";

export default function ManagePricingTab({ product, updateProduct, patchProduct, setProduct }) {
  const { register, handleSubmit, setValue } = useForm();
  const updater = updateProduct || patchProduct;

  useEffect(() => {
    if (product) {
      setValue("price", product.price);
      setValue("discount", product.discount || 0);
    }
  }, [product, setValue]);

  const onPricingSubmit = async (data) => {
    try {
      const payload = { price: Number(data.price), discount: Number(data.discount) };
      await updater({ 
        id: product._id, 
        data: payload
      });
      if (setProduct) {
        setProduct((prev) => ({ ...prev, ...payload }));
      }
      swalToast("Prices updated", "success");
    } catch (err) {
      swalError("Error", err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onPricingSubmit)} className="p-0 space-y-12">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center border border-emerald-600/20">
          <DollarSign size={20} className="text-emerald-600" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.2em]">Pricing Dynamics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Retail Price (৳)</Label>
          <Input 
            type="number"
            {...register("price", { required: true, valueAsNumber: true })}
            className="h-24 bg-muted/30 border-border/10 rounded-3xl px-8 font-black text-4xl tracking-tighter"
          />
        </div>
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Discount Rate (%)</Label>
          <Input 
            type="number"
            {...register("discount", { valueAsNumber: true })}
            className="h-24 bg-emerald-600/5 border-emerald-600/10 rounded-3xl px-8 font-black text-4xl tracking-tighter text-emerald-600"
          />
        </div>
      </div>

      <div className="pt-6 border-t border-border/5 flex justify-end">
        <Button type="submit" className="h-16 px-10 bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
          Update Pricing
        </Button>
      </div>
    </form>
  );
}
