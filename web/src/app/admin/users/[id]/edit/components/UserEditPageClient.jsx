"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminUsers } from "@/app/admin/users/lib/useAdminUsers";
import { useRoles } from "@/app/(auth)/lib/useRoles";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Loader from "@/components/common/Loader";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/utils/imageUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageContainer } from "@/app/admin/_components/AdminPageContainer";
import { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { 
  AdminCard, 
  AdminCardHeader, 
  AdminCardTitle, 
  AdminCardDescription, 
  AdminCardContent, 
  AdminCardFooter 
} from "@/app/admin/_components/AdminCard";
import { notify } from "@/utils/swal";

export default function UserEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { useUser, updateUser } = useAdminUsers();
  const { roles, isLoading: isRolesLoading } = useRoles();
  const { data: userData, isLoading: isUserLoading } = useUser(id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (userData) {
      setValue("name", userData.name);
      setValue("email", userData.email);
      setValue("phone", userData.phone || "");
      setValue("role", userData.role?._id || userData.role || "");
      setValue("isEmailVerified", userData.isEmailVerified || false);
    }
  }, [userData, setValue]);

  const onUpdateProfile = async (data) => {
    setIsSubmitting(true);
    try {
      await updateUser.mutateAsync({ id, data });
      notify.success("User updated successfully");
      router.push("/admin/users");
    } catch (err) {
      notify.error("Update Failed", err.response?.data?.message || "Could not update user details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isRolesLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <AdminPageContainer className="max-w-3xl space-y-6">
      <AdminBackLink href="/admin/users" label="Back to Users" />

      <form onSubmit={handleSubmit(onUpdateProfile)}>
        <AdminCard>
          <AdminCardHeader className="border-b border-border/60 pb-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-14 rounded-full border border-border/60">
                <AvatarImage src={getImageUrl(userData?.avatar)} referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {userData?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <AdminCardTitle className="text-lg font-bold">
                  Edit User: {userData?.name}
                </AdminCardTitle>
                <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
                  Update customer account details, access role, and verification status.
                </AdminCardDescription>
              </div>
            </div>
          </AdminCardHeader>

          <AdminCardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-muted-foreground" /> Full Name *
                </label>
                <input
                  type="text"
                  {...register("name", { required: "Name is required" })}
                  placeholder="e.g. John Doe"
                  className="w-full h-10 px-3 rounded-lg border border-border/70 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {errors.name && (
                  <p className="text-xs text-rose-600 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Phone */}
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

            {/* Email (Read only) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" /> Email Address (Read-only)
              </label>
              <input
                type="email"
                value={userData?.email || ""}
                disabled
                className="w-full h-10 px-3 rounded-lg border border-border/40 bg-muted/50 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Role & Verification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-muted-foreground" /> Account Role
                </label>
                <select
                  {...register("role")}
                  className="w-full h-10 px-3 rounded-lg border border-border/70 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="">Customer (Default)</option>
                  {roles?.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <label className="inline-flex items-center gap-2.5 h-10 px-3 rounded-lg border border-border/70 bg-background cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    {...register("isEmailVerified")}
                    className="size-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-foreground">
                    Email is verified
                  </span>
                </label>
              </div>
            </div>
          </AdminCardContent>

          <AdminCardFooter className="border-t border-border/60 pt-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              asChild
              className="h-10 text-xs"
            >
              <Link href="/admin/users">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 text-xs gap-2"
            >
              <Save className="size-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </AdminCardFooter>
        </AdminCard>
      </form>
    </AdminPageContainer>
  );
}
