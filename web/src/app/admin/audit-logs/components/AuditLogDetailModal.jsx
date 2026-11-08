"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Clock,
  Shield,
  Layers,
  Globe,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Laptop,
  Calendar,
  Hash,
  Package,
  ShoppingBag,
  Tag,
  FileText,
  Settings as SettingsIcon,
  ShieldAlert,
  Truck,
  Eye,
  Key,
} from "lucide-react";

/**
 * Resolve direct deep-link to resource detail if available.
 */
function getResourceUrl(module, resourceId) {
  if (!resourceId || typeof resourceId !== "string") return null;
  const mod = String(module || "").toLowerCase();
  if (mod === "order") return `/admin/orders/${resourceId}`;
  if (mod === "product") return `/admin/products/${resourceId}`;
  if (mod === "category") return `/admin/categories/${resourceId}`;
  if (mod === "blog") return `/admin/blog/${resourceId}`;
  if (mod === "coupon") return `/admin/coupons/${resourceId}`;
  return null;
}

/**
 * Dedicated Module Icon component declared outside of render.
 */
function ModuleIcon({ module, className = "size-3.5" }) {
  const mod = String(module || "").toLowerCase();
  switch (mod) {
    case "order":
      return <ShoppingBag className={className} />;
    case "product":
      return <Package className={className} />;
    case "category":
    case "subcategory":
      return <Tag className={className} />;
    case "blog":
      return <FileText className={className} />;
    case "auth":
      return <Key className={className} />;
    case "settings":
      return <SettingsIcon className={className} />;
    case "role":
    case "user":
      return <User className={className} />;
    default:
      return <Layers className={className} />;
  }
}

/**
 * Format timestamp into detailed localized date & time.
 */
function formatAuditTime(timestamp) {
  if (!timestamp) return { relative: "—", absolute: "—", time: "—" };
  const d = new Date(timestamp);
  const absolute = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { absolute, time };
}

export default function AuditLogDetailModal({ log, isOpen, onClose }) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "raw"

  if (!log) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(log._id || "");
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyJson = () => {
    if (!log.details) return;
    navigator.clipboard.writeText(JSON.stringify(log.details, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyValue = (key, val) => {
    navigator.clipboard.writeText(String(val));
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const isTransition =
    log.details?.previousStatus !== undefined && log.details?.newStatus !== undefined;

  // Key-value pairs for structured metadata inspector
  const detailEntries =
    log.details && typeof log.details === "object"
      ? Object.entries(log.details).filter(
          ([key]) => key !== "previousStatus" && key !== "newStatus"
        )
      : [];

  const resourceUrl = getResourceUrl(log.module, log.resourceId);
  const timeInfo = formatAuditTime(log.createdAt);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={true}
        className="!max-w-3xl sm:!max-w-4xl w-full p-0 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl gap-0 max-h-[90vh] flex flex-col"
      >
        {/* ============================================================ */}
        {/* 1. HERO HEADER: Visual Hierarchy & Status Badges              */}
        {/* ============================================================ */}
        <div className="relative px-6 py-6 sm:px-8 sm:py-7 border-b border-border/60 bg-gradient-to-b from-muted/50 via-muted/20 to-transparent shrink-0">
          <div className="flex flex-col gap-4">
            {/* Top Tag Row */}
            <div className="flex items-center justify-between gap-3 flex-wrap pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Module Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/25">
                  <ModuleIcon module={log.module} className="size-3.5" />
                  {log.module}
                </span>

                {/* Action Badge */}
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-muted text-foreground border border-border/60">
                  {log.action}
                </span>

                {/* Status Pill */}
                {log.status === "SUCCESS" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <CheckCircle2 className="size-3.5" />
                    Success
                  </span>
                )}
                {(log.status === "FAILED" || log.status === "FAILURE") && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <XCircle className="size-3.5" />
                    Failed
                  </span>
                )}
                {log.status === "WARNING" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="size-3.5" />
                    Warning
                  </span>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium tabular-nums">
                <Calendar className="size-3.5 text-muted-foreground/70" />
                <span>{timeInfo.absolute}</span>
                <span>•</span>
                <Clock className="size-3.5 text-muted-foreground/70" />
                <span>{timeInfo.time}</span>
              </div>
            </div>

            {/* Main Event Headline */}
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                {log.description}
              </DialogTitle>

              {/* Sub-bar: Event ID Chip with 1-click Copy */}
              <div className="flex items-center gap-2 mt-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 hover:bg-muted text-[11px] font-mono text-muted-foreground hover:text-foreground border border-border/60 transition-colors cursor-pointer group shadow-2xs"
                  title="Click to copy full Audit ID"
                >
                  <Hash className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="truncate max-w-[260px] sm:max-w-none">{log._id}</span>
                  {copiedId ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3 text-muted-foreground/70 group-hover:text-foreground" />
                  )}
                </button>
                {copiedId && (
                  <span className="text-[11px] font-medium text-emerald-500 animate-in fade-in duration-150">
                    Audit ID copied!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SCROLLABLE BODY CONTENT                                   */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
          {/* Status Transition Stepper (if present) */}
          {isTransition && (
            <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Truck className="size-4" />
                <span>Lifecycle Transition</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs font-semibold">
                <span className="px-3 py-1 rounded-xl bg-background/90 text-muted-foreground border border-border/80 uppercase">
                  {log.details.previousStatus}
                </span>
                <ArrowRight className="size-4 text-primary shrink-0 animate-pulse" />
                <span className="px-3 py-1 rounded-xl bg-primary text-primary-foreground uppercase shadow-xs">
                  {log.details.newStatus}
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. BENTO GRID: Actor + Target Resource + Network              */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Actor Card */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-primary" /> Initiated By
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-mono font-bold bg-muted/80 text-foreground border-border/80"
                >
                  {log.userRole || "Admin"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 pt-0.5">
                <Avatar className="size-11 rounded-xl border border-border/60 shadow-2xs">
                  <AvatarImage src={log.user?.avatar} alt={log.userName} />
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary rounded-xl">
                    {(log.userName || "Admin").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-sm font-bold text-foreground truncate" title={log.userName}>
                    {log.userName || "System Operator"}
                  </div>
                  <div
                    className="text-xs font-mono text-muted-foreground truncate"
                    title={log.userEmail}
                  >
                    {log.userEmail || "system@local"}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Target Resource Card */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" /> Target Resource
                </span>
                <span className="text-xs font-semibold text-primary">{log.module}</span>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <div className="text-xs text-muted-foreground">Resource Name:</div>
                <div
                  className="text-sm font-bold text-foreground truncate"
                  title={log.resourceName}
                >
                  {log.resourceName || `${log.module} Entity`}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-muted-foreground">Identifier:</div>
                  <div className="font-mono text-xs font-semibold text-foreground px-2 py-0.5 rounded-md bg-muted border border-border/50 truncate max-w-[150px]">
                    {log.resourceId || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Network & Origin Card */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe className="size-3.5 text-primary" /> Environment & Origin
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                  <Laptop className="size-3" /> Client
                </span>
              </div>

              <div className="space-y-2 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Client IP:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyValue("ip", log.ipAddress || "127.0.0.1")}
                    className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded-lg bg-muted hover:bg-muted/80 border border-border/60 transition-colors cursor-pointer"
                    title="Click to copy IP"
                  >
                    <span>{log.ipAddress || "127.0.0.1"}</span>
                    {copiedField === "ip" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3 text-muted-foreground/60" />
                    )}
                  </button>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-muted-foreground block">User Agent:</span>
                  <div
                    className="text-[11px] font-mono text-muted-foreground/90 bg-muted/50 p-2 rounded-xl border border-border/50 truncate leading-relaxed"
                    title={log.userAgent}
                  >
                    {log.userAgent || "Internal Dispatch / Direct API"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 4. PAYLOAD & METADATA INSPECTOR (TABBED VIEW)                */}
          {/* ============================================================ */}
          {log.details && Object.keys(log.details).length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-2xs">
              {/* Tab Header Bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/30">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "overview"
                        ? "bg-background text-foreground shadow-2xs border border-border/60"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Structured Attributes ({detailEntries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("raw")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "raw"
                        ? "bg-background text-foreground shadow-2xs border border-border/60"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Raw JSON
                  </button>
                </div>

                {/* Copy JSON Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-8 rounded-xl text-xs font-semibold gap-1.5 border-border/60 bg-background/80 hover:bg-muted cursor-pointer shadow-2xs"
                >
                  {copiedJson ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" />
                      <span>Copied JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-muted-foreground" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Tab Body: Structured Overview */}
              {activeTab === "overview" && (
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {detailEntries.map(([key, val]) => {
                      const displayVal =
                        typeof val === "object" && val !== null
                          ? JSON.stringify(val)
                          : String(val);
                      return (
                        <div
                          key={key}
                          className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1 hover:border-border transition-colors group relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                              {key}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyValue(key, displayVal)}
                              className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                              title="Copy attribute value"
                            >
                              {copiedField === key ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                          <div
                            className="font-mono text-xs font-semibold text-foreground break-all leading-snug"
                            title={displayVal}
                          >
                            {displayVal}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab Body: Raw Code View */}
              {activeTab === "raw" && (
                <div className="p-5 bg-background/50">
                  <pre className="rounded-xl border border-border/60 bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground overflow-x-auto max-h-72">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 5. FOOTER BAR: Security Guarantee & Quick Direct Actions     */}
        {/* ============================================================ */}
        <div className="px-6 py-4 sm:px-8 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="size-4 text-primary shrink-0" />
            <span className="text-[11px] font-medium">
              Immutable Audit Log • Verified by Security Pipeline
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* Direct Link to Resource if applicable */}
            {resourceUrl && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold gap-1.5 border-border/80 bg-background hover:bg-muted shadow-2xs"
              >
                <Link href={resourceUrl} target="_blank" rel="noopener noreferrer">
                  <span>Open {log.module}</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </Button>
            )}

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold px-5 cursor-pointer shadow-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
