"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCcw } from "lucide-react";
import { getImageUrl } from "@/utils/imageUtils";
import ProfileAvatarUpload from "@/app/profile/components/ProfileAvatarUpload";

export default function ProfileIdentity({ user, ui, onUpdate, loading }) {
  const [avatarPreview, setAvatarPreview] = useState(getImageUrl(user.avatar));
  const [prevUserAvatar, setPrevUserAvatar] = useState(user.avatar);
  
  if (user.avatar !== prevUserAvatar) {
    setPrevUserAvatar(user.avatar);
    setAvatarPreview(getImageUrl(user.avatar));
  }

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user.name,
      phone: user.phone || "",
      bio: user.bio || "",
      address: user.addresses?.[0]?.address || user.addresses?.[0]?.street || "",
    }
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-border/10">
        <div>
          <h3 className="text-3xl font-black uppercase tracking-tighter italic">{ui.editTitle}</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{ui.editSub}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onUpdate)} className="space-y-10">
        <ProfileAvatarUpload 
          avatarPreview={avatarPreview} 
          handleAvatarChange={handleAvatarChange} 
          ui={ui} 
          register={register} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {ui.nameLabel}
            </Label>
            <Input 
              {...register("name", { required: true })}
              className="h-14 rounded-2xl bg-accent/5 border-border/50 focus:border-accent-secondary/50 focus:ring-accent-secondary/10 transition-all font-bold"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {ui.emailLabel}
            </Label>
            <Input 
              value={user.email}
              disabled
              className="h-14 rounded-2xl bg-accent/10 border-border/30 text-muted-foreground cursor-not-allowed font-bold"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {ui.phoneLabel}
            </Label>
            <Input 
              {...register("phone")}
              placeholder="+880..."
              className="h-14 rounded-2xl bg-accent/5 border-border/50 focus:border-accent-secondary/50 transition-all font-bold"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {ui.addressLabel || "Full Address"}
          </Label>
          <Textarea 
            {...register("address")}
            rows={3}
            placeholder="Street address, house, apartment, area, city..."
            className="rounded-[2rem] bg-accent/5 border-border/50 focus:border-accent-secondary/50 transition-all font-medium p-6 min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {ui.bioLabel}
          </Label>
          <Textarea 
            {...register("bio")}
            rows={4}
            placeholder="Tell us a bit about yourself..."
            className="rounded-[2rem] bg-accent/5 border-border/50 focus:border-accent-secondary/50 transition-all font-medium p-6 min-h-[150px]"
          />
        </div>

        <div className="pt-10 flex justify-end">
          <Button 
            type="submit" 
            disabled={loading}
            className="h-16 px-12 rounded-full bg-foreground text-background font-black uppercase tracking-widest text-[11px] hover:bg-accent-secondary hover:text-white transition-all shadow-2xl disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCcw className="mr-3 h-4 w-4 animate-spin" />
                {ui.saving}
              </>
            ) : ui.saveBtn}
          </Button>
        </div>
      </form>
    </div>
  );
}
