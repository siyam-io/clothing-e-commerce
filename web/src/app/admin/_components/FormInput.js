"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function FormInput({
  label,
  name,
  register,
  errors = {},
  type = "text",
  required = false,
  placeholder = "",
  className,
  ...props
}) {
  const error = errors?.[name];
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role?.name === "superadmin";

  const isSecretField = 
    type === "password" || 
    /key|token|secret|pass|password|credential/i.test(name) ||
    /key|token|secret|pass|password|credential/i.test(label || "");

  const [showSecret, setShowSecret] = useState(false);

  const inputType = isSecretField ? (showSecret && isSuperAdmin ? "text" : "password") : type;

  const registration = register ? register(name, {
    required: required ? `${label || name} is required` : false,
  }) : {};

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label 
          htmlFor={name}
          className="text-xs font-medium text-muted-foreground ml-0.5 inline-block"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id={name}
          type={inputType}
          {...registration}
          placeholder={placeholder}
          className={cn(
            "bg-background/80 border-border/60 h-10 rounded-xl text-sm font-normal text-foreground focus-visible:ring-1 focus-visible:ring-primary focus:border-primary transition-colors shadow-2xs w-full",
            isSecretField && "font-mono normal-case tracking-normal pr-10",
            error && "border-rose-500 bg-rose-500/5 focus:border-rose-500 focus-visible:ring-rose-500/20"
          )}
          {...props}
        />
        {isSecretField && isSuperAdmin && (
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors p-1"
            title={showSecret ? "Hide secret" : "Show secret"}
          >
            {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-xs font-normal text-rose-500 ml-0.5 animate-in fade-in slide-in-from-top-1">
          {error.message}
        </p>
      )}
    </div>
  );
}
