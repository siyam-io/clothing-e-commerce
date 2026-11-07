"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { getImageUrl } from "@/utils/imageUtils";
import api from "@/lib/api";
import Loader from "@/components/common/Loader";
import ProtectedRoute from "@/app/admin/_components/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";
import { 
  Camera, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageContainer } from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader from "@/app/admin/_components/AdminPageHeader";
import { 
  AdminCard, 
  AdminCardHeader, 
  AdminCardTitle, 
  AdminCardDescription, 
  AdminCardContent, 
  AdminCardFooter 
} from "@/app/admin/_components/AdminCard";
import { notify } from "@/utils/swal";

export default function AdminProfile() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (user) {
      setValue("name", user.name || "");
      setValue("phone", user.phone || "");
      setValue("bio", user.bio || "");
      if (user.avatar) {
        setAvatarPreview(getImageUrl(user.avatar));
      }
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.phone) formData.append("phone", data.phone);
    if (data.bio) formData.append("bio", data.bio);
    if (data.avatar && data.avatar[0]) {
      formData.append("avatar", data.avatar[0]);
    }

    try {
      setLoading(true);
      const response = await api.put("/users/profile", formData);
      notify.success("Profile updated successfully!");
      localStorage.setItem("user", JSON.stringify(response.data));
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      notify.error("Update Failed", err.response?.data?.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (authLoading) return <Loader />;
  if (!user) return null;

  return (
    <ProtectedRoute>
      <AdminPageContainer className="max-w-3xl space-y-6">
        <AdminPageHeader
          title="My Profile"
          description="Manage your account profile, contact information, and avatar"
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <AdminCard>
            <AdminCardHeader className="border-b border-border/60 pb-5">
              <AdminCardTitle className="text-base font-semibold">
                Personal Information
              </AdminCardTitle>
              <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
                Update your display name, public bio, and avatar.
              </AdminCardDescription>
            </AdminCardHeader>

            <AdminCardContent className="space-y-6 pt-6">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Profile Photo
                </label>
                <div className="flex items-center gap-5">
                  <div className="relative size-20 rounded-full overflow-hidden bg-muted border border-border/60 shrink-0">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xl font-bold text-foreground">
                        {user.name?.charAt(0).toUpperCase() || "A"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      {...register("avatar")}
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <label 
                      htmlFor="avatar-upload"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border/70 hover:bg-muted text-xs font-medium cursor-pointer transition-colors"
                    >
                      <Upload className="size-3.5" /> Change Photo
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground" /> Full Name *
                  </label>
                  <input
                    type="text"
                    {...register("name", { required: "Name is required" })}
                    placeholder="Your name"
                    className="w-full h-10 px-3 rounded-lg border border-border/70 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-600 font-medium">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    {...register("phone")}
                    placeholder="+880 1XXX XXXXXX"
                    className="w-full h-10 px-3 rounded-lg border border-border/70 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" /> Email Address (Immutable)
                </label>
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-border/40 bg-muted/50 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Short Bio
                </label>
                <textarea
                  {...register("bio")}
                  rows="3"
                  placeholder="Tell us a little about your role..."
                  className="w-full p-3 rounded-lg border border-border/70 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>
            </AdminCardContent>

            <AdminCardFooter className="border-t border-border/60 pt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                className="h-10 text-xs"
              >
                Discard Changes
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 text-xs gap-2"
              >
                <Save className="size-4" />
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </AdminCardFooter>
          </AdminCard>
        </form>
      </AdminPageContainer>
    </ProtectedRoute>
  );
}
