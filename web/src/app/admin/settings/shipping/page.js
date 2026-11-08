"use client";

import { useState, useEffect } from "react";
import { Truck, Save, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useSettings } from "@/app/admin/settings/lib/useSettings";
import { notify } from "@/utils/swal";
import { Button } from "@/components/ui/button";
import { 
  AdminCard, 
  AdminCardHeader, 
  AdminCardTitle, 
  AdminCardDescription, 
  AdminCardContent, 
  AdminCardFooter 
} from "@/app/admin/_components/AdminCard";
import FormInput from "@/app/admin/_components/FormInput";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Price } from "@/components/common/Price";

export default function ShippingSettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const [formData, setFormData] = useState({
    couriers: []
  });

  const [newCourier, setNewCourier] = useState({
    name: "",
    charge: "",
    estimatedDays: ""
  });
  const [prevSettings, setPrevSettings] = useState(null);

  if (settings?.shipping && settings !== prevSettings) {
    setPrevSettings(settings);
    setFormData({
      couriers: settings.shipping.couriers || []
    });
  }

  const handleAddCourier = () => {
    if (!newCourier.name.trim() || !newCourier.charge) {
      notify.error("Missing Information", "Courier name and delivery charge are required");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      couriers: [
        ...(prev.couriers || []),
        {
          name: newCourier.name.trim(),
          charge: Number(newCourier.charge),
          estimatedDays: newCourier.estimatedDays.trim() || "Standard Delivery",
          isActive: true
        }
      ]
    }));

    setNewCourier({ name: "", charge: "", estimatedDays: "" });
    notify.success("Courier added to list");
  };

  const handleToggleCourier = (index) => {
    setFormData(prev => {
      const list = [...(prev.couriers || [])];
      list[index] = { ...list[index], isActive: !list[index].isActive };
      return { ...prev, couriers: list };
    });
  };

  const handleDeleteCourier = (index) => {
    setFormData(prev => {
      const list = [...(prev.couriers || [])];
      list.splice(index, 1);
      return { ...prev, couriers: list };
    });
    notify.success("Courier removed");
  };

  const handleSave = async () => {
    const payload = new FormData();
    payload.append("shipping", JSON.stringify(formData));
    await updateSettings(payload);
  };

  if (isLoading && !settings) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">Shipping Rates & Couriers</AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Configure delivery methods, local shipping zones, and delivery fee calculation.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-6 pt-5">
          {/* Add New Courier Form */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-4">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Plus className="size-3.5 text-primary" /> Add New Shipping Method
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Method / Zone Name *</label>
                <input
                  type="text"
                  value={newCourier.name}
                  onChange={(e) => setNewCourier({ ...newCourier, name: e.target.value })}
                  placeholder="e.g. Inside Dhaka"
                  className="w-full h-10 px-3 rounded-lg border border-border/70 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Delivery Charge (৳) *</label>
                <input
                  type="number"
                  value={newCourier.charge}
                  onChange={(e) => setNewCourier({ ...newCourier, charge: e.target.value })}
                  placeholder="e.g. 70"
                  className="w-full h-10 px-3 rounded-lg border border-border/70 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Estimated Delivery Time</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCourier.estimatedDays}
                    onChange={(e) => setNewCourier({ ...newCourier, estimatedDays: e.target.value })}
                    placeholder="e.g. 2-3 Days"
                    className="w-full h-10 px-3 rounded-lg border border-border/70 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCourier}
                    className="h-10 text-xs shrink-0"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Couriers List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground">Active Shipping Methods</h4>
            {formData.couriers?.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No shipping zones defined yet. Add one above.
              </p>
            ) : (
              <div className="divide-y divide-border/50 border border-border/60 rounded-xl overflow-hidden">
                {formData.couriers.map((courier, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 flex items-center justify-between bg-card hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Truck className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{courier.name}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs px-2 py-0.2 rounded-full",
                              courier.isActive
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-200/60"
                                : "bg-muted text-muted-foreground border-border/60"
                            )}
                          >
                            {courier.isActive ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span>Charge:</span>
                          <strong className="text-foreground"><Price amount={courier.charge} /></strong>
                          <span>• Time: {courier.estimatedDays}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCourier(idx)}
                        className="h-8 text-xs"
                      >
                        {courier.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCourier(idx)}
                        className="size-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminCardContent>

        <AdminCardFooter className="border-t border-border/60 pt-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="h-10 text-xs gap-2"
          >
            <Save className="size-4" />
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </AdminCardFooter>
      </AdminCard>
    </div>
  );
}
