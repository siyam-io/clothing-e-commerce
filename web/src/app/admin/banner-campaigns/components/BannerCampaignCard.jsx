"use client";

import Link from "next/link";
import { Edit2, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminCard } from "@/app/admin/_components/AdminCard";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";
import { getImageUrl } from "@/utils/imageUtils";

export default function BannerCampaignCard({ campaign, onDelete }) {
  const mainSlide = campaign.slides?.[0];

  return (
    <AdminCard className="flex flex-col justify-between hover:border-border transition-colors">
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h4 className="text-base font-semibold text-foreground tracking-tight line-clamp-1">
              {campaign.name}
            </h4>
            <span className="font-mono text-[11px] text-muted-foreground">
              ID: #{campaign._id.slice(-8).toUpperCase()}
            </span>
          </div>

          <AdminStatusBadge
            value={campaign.isActive ? "active" : "inactive"}
            label={campaign.isActive ? "Active on Store" : "Inactive"}
          />
        </div>

        {campaign.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}

        {/* Banner Preview */}
        <div className="aspect-[21/9] rounded-xl overflow-hidden border border-border/60 bg-muted/30 relative">
          {mainSlide?.image ? (
            <img
              src={getImageUrl(mainSlide.image)}
              alt={campaign.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full flex flex-col items-center justify-center text-muted-foreground/60 gap-1.5">
              <ImageIcon className="size-6 stroke-[1.5]" />
              <span className="text-[11px]">No banner image</span>
            </div>
          )}
          {campaign.slides?.length > 1 && (
            <Badge className="absolute bottom-2 right-2 bg-background/80 text-foreground border border-border/60 backdrop-blur-md text-[10px]">
              {campaign.slides.length} slides
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 p-4 border-t border-border/40 bg-muted/20">
        <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs font-medium gap-1.5">
          <Link href={`/admin/banner-campaigns/${campaign._id}`}>
            <Edit2 className="size-3" /> Edit Campaign
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onDelete(campaign._id)}
          className="size-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-border/60"
          title="Delete campaign"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </AdminCard>
  );
}
