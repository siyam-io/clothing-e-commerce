"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminBannerCampaigns } from "@/app/admin/banner-campaigns/lib/useAdminBannerCampaigns";
import { swalToast, swalError } from "@/utils/swal";
import { Plus, Layout } from "lucide-react";
import BannerCampaignCard from "./components/BannerCampaignCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import Pagination from "@/components/common/Pagination";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminHeaderButton } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard } from "@/app/admin/_components/AdminCard";
import AdminDeleteModal from "@/app/admin/_components/AdminDeleteModal";

export default function BannerCampaignListPage() {
  const { page, setPage, queryParams } = useFilters({ initialLimit: 30 });
  const { campaigns, total, pages, isLoading, deleteCampaign } = useAdminBannerCampaigns(queryParams);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCampaign(deleteTarget.id);
      swalToast("Banner campaign deleted successfully", "success");
      setDeleteTarget(null);
    } catch (err) {
      swalError("Delete Failed", "Could not delete the campaign.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Banner Campaigns"
        description={`Manage storefront hero sliders, promotional banners, and visual campaigns · ${total || 0} total`}
        actions={
          <AdminHeaderButton href="/admin/banner-campaigns/new" icon={Plus}>
            New Campaign
          </AdminHeaderButton>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <AdminCard key={n} className="min-h-[260px] p-6 space-y-4">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </AdminCard>
            ))
          ) : !campaigns || campaigns.length === 0 ? (
            <AdminCard className="col-span-full border-dashed p-12 text-center flex flex-col items-center justify-center">
              <div className="size-12 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <Layout className="size-6 opacity-40" />
              </div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">No Banner Campaigns Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Create a promotional banner slider to highlight seasonal discounts or new collections.
              </p>
              <Button asChild size="sm" className="rounded-xl font-medium">
                <Link href="/admin/banner-campaigns/new">
                  <Plus className="size-3.5 mr-1.5" /> Create Banner Campaign
                </Link>
              </Button>
            </AdminCard>
          ) : (
            campaigns.map((campaign) => (
              <BannerCampaignCard 
                key={campaign._id} 
                campaign={campaign} 
                onDelete={(id) => setDeleteTarget({ id, name: campaign.name })} 
              />
            ))
          )}
        </div>

        {pages > 1 && (
          <div className="flex justify-center pt-6">
            <Pagination 
              page={page} 
              totalPages={pages} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </div>

      <AdminDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Banner Campaign"
        itemName={deleteTarget?.name}
        description="Are you sure you want to permanently delete this banner campaign from the storefront?"
        isLoading={isDeleting}
      />
    </AdminPageContainer>
  );
}
