"use client";

import Link from "next/link";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Calendar, ArrowRight } from "lucide-react";
import { getImageUrl } from "@/utils/imageUtils";

export function UsersTable({ users, isLoading }) {
  return (
    <AdminCard>
      <AdminCardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <User className="size-4 text-primary" />
          <AdminCardTitle className="text-base font-semibold">
            Recently Joined Customers
          </AdminCardTitle>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors"
        >
          Manage All <ArrowRight className="size-3" />
        </Link>
      </AdminCardHeader>
      <AdminCardContent className="space-y-3 pt-1">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))
        ) : !users || users.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            No customers registered recently
          </div>
        ) : (
          users.slice(0, 5).map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg bg-muted border border-border/60 flex items-center justify-center font-medium text-foreground shrink-0 overflow-hidden">
                  {user.avatar ? (
                    <img 
                      src={getImageUrl(user.avatar)} 
                      alt={user.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <User className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="size-3 shrink-0" /> {user.email}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Calendar className="size-3" /> {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
