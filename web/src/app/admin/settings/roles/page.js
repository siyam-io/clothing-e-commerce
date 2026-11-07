"use client";
 
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRoles, createRole, updateRole, deleteRole } from "@/app/admin/settings/lib/settings";
import { useAuthStore } from "@/store/authStore";
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Lock, 
  ArrowLeft,
  Save,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AdminCard, 
  AdminCardHeader, 
  AdminCardTitle, 
  AdminCardDescription, 
  AdminCardContent, 
  AdminCardFooter 
} from "@/app/admin/_components/AdminCard";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/utils/swal";
import { cn } from "@/lib/utils";

const RESOURCES = [
  "dashboard", "products", "categories", "orders", "users", "roles", 
  "coupons", "blogs", "settings", "banner-campaigns", "flash-sales", "chat", "ai-chat", "reports", "homeLayout"
];

const ACTIONS = ["view", "create", "update", "delete", "manage"];

const RESOURCE_LABELS = {
  "dashboard": "Dashboard",
  "products": "Products",
  "categories": "Categories",
  "orders": "Orders",
  "users": "Users",
  "roles": "Roles",
  "coupons": "Coupons",
  "blogs": "Blogs",
  "settings": "Settings",
  "banner-campaigns": "Banners",
  "flash-sales": "Flash Sales",
  "chat": "Live Chat",
  "ai-chat": "Manage with AI",
  "reports": "Reports",
  "homeLayout": "Layout Builder"
};

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { checkSession } = useAuthStore();
  const [view, setView] = useState("list"); // "list" | "add" | "edit"
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: []
  });

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries(["roles"]);
      checkSession();
      notify.success("Role created successfully");
      setView("list");
    },
    onError: (err) => {
      notify.error("Creation Failed", err.response?.data?.message || err.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["roles"]);
      checkSession();
      notify.success("Role updated successfully");
      setView("list");
    },
    onError: (err) => {
      notify.error("Update Failed", err.response?.data?.message || err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries(["roles"]);
      checkSession();
      notify.success("Role deleted successfully");
    },
    onError: (err) => {
      notify.error("Deletion Failed", err.response?.data?.message || err.message);
    }
  });

  const handleStartAdd = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      permissions: []
    });
    setView("add");
  };

  const handleStartEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || []
    });
    setView("edit");
  };

  const handleTogglePermission = (permission) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(permission);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission]
      };
    });
  };

  const handleToggleResourceAll = (resource) => {
    const resourcePermissions = ACTIONS.map(a => `${resource}:${a}`);
    const hasAll = resourcePermissions.every(p => formData.permissions.includes(p));

    setFormData(prev => {
      if (hasAll) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => !resourcePermissions.includes(p))
        };
      }
      const newPerms = new Set([...prev.permissions, ...resourcePermissions]);
      return {
        ...prev,
        permissions: Array.from(newPerms)
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return notify.error("Validation Error", "Role name is required");

    if (view === "edit" && editingRole) {
      updateMutation.mutate({ id: editingRole._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await notify.confirm(
      "Delete Role?",
      "Are you sure you want to permanently delete this role?"
    );
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-foreground">Access Roles</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage permissions assigned to admin accounts</p>
          </div>
          <Button 
            onClick={handleStartAdd}
            className="h-10 text-xs gap-2"
          >
            <Plus className="size-4" /> Create New Role
          </Button>
        </div>

        <AdminCard>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Role Name</TableHead>
                  <TableHead className="text-xs font-semibold">Description</TableHead>
                  <TableHead className="text-xs font-semibold">Access Level</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i} className="border-border/50">
                      <TableCell className="p-4"><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="p-4"><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="p-4"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="p-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : roles.map((role) => (
                  <TableRow key={role._id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-semibold text-foreground capitalize">{role.name}</span>
                        {role.isSystem && (
                          <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border/60 px-2 py-0.2">System</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 max-w-sm">
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {role.description || "No description provided."}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {role.name === "superadmin" ? (
                        <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 border-rose-200/60">
                          Full Superadmin Access
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/40 border-blue-200/60">
                          {role.permissions?.length || 0} permissions
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleStartEdit(role)}
                          className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                          title="Edit Role"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(role._id)}
                          disabled={role.isSystem}
                          className="size-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                          title="Delete Role"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AdminCard>
      </div>
    );
  }

  // Add / Edit Form View
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => setView("list")}
          className="h-10 text-xs gap-2"
        >
          <ArrowLeft className="size-4" /> Back to Roles
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={createMutation.isLoading || updateMutation.isLoading}
          className="h-10 text-xs gap-2"
        >
          <Save className="size-4" />
          {view === "edit" ? "Save Role" : "Create Role"}
        </Button>
      </div>

      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <AdminCardTitle className="text-base font-semibold">
            {view === "edit" ? `Edit Role: ${editingRole?.name}` : "New Role Details"}
          </AdminCardTitle>
          <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
            Specify the identifier name and internal purpose for this role.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Role Name *</label>
              <Input 
                placeholder="e.g. Content Editor"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={editingRole && !editingRole.isEditable}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Role Description</label>
              <Input 
                placeholder="Brief summary of duties..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="h-10 text-sm"
              />
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <AdminCardTitle className="text-base font-semibold">Permission Matrix</AdminCardTitle>
              <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
                Selected permissions: <strong className="text-primary">{formData.permissions.length}</strong>
              </AdminCardDescription>
            </div>
          </div>
        </AdminCardHeader>

        <AdminCardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESOURCES.map((resource) => {
              const resourcePermissions = ACTIONS.map(a => `${resource}:${a}`);
              const hasAll = resourcePermissions.every(p => formData.permissions.includes(p));
              const isLocked = editingRole && !editingRole.isEditable && editingRole.isSystem;

              return (
                <div 
                  key={resource} 
                  className={cn(
                    "p-3.5 rounded-xl border transition-all",
                    hasAll 
                      ? "border-primary/40 bg-primary/5 shadow-2xs" 
                      : "border-border/60 bg-card hover:border-border"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">
                          {RESOURCE_LABELS[resource] || resource}
                        </span>
                        {isLocked && <Lock className="size-3 text-muted-foreground" />}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleResourceAll(resource)}
                        disabled={isLocked}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-md font-medium transition-colors border",
                          hasAll 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-muted text-muted-foreground border-border/60 hover:bg-muted/80"
                        )}
                      >
                        {hasAll ? "Revoke All" : "Grant All"}
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {ACTIONS.map((action) => {
                        const perm = `${resource}:${action}`;
                        const isChecked = formData.permissions.includes(perm);
                        return (
                          <button
                            key={action}
                            type="button"
                            onClick={() => handleTogglePermission(perm)}
                            disabled={isLocked}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize border",
                              isChecked 
                                ? "bg-foreground text-background border-foreground font-semibold" 
                                : "bg-muted/40 text-muted-foreground border-border/60 hover:border-foreground/30"
                            )}
                          >
                            {action}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCardContent>

        <AdminCardFooter className="border-t border-border/60 pt-4 flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isLoading || updateMutation.isLoading}
            className="h-10 text-xs gap-2"
          >
            <Save className="size-4" />
            {view === "edit" ? "Save Role Changes" : "Create Role"}
          </Button>
        </AdminCardFooter>
      </AdminCard>
    </div>
  );
}
