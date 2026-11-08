"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAdminBannerCampaigns, useAdminBannerCampaign } from "@/app/admin/banner-campaigns/lib/useAdminBannerCampaigns";
import { swalError, swalToast } from "@/utils/swal";
import Loader from "@/components/common/Loader";
import BannerCampaignForm from "../components/BannerCampaignForm";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";

export default function BannerCampaignFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const isEdit = id !== "new";

  const { createCampaign, updateCampaign } = useAdminBannerCampaigns();
  const { campaign, isLoading: isCampaignLoading } = useAdminBannerCampaign(id);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slides: [],
    isActive: false,
  });
  const [slideFiles, setSlideFiles] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEdit && campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description || "",
        slides: campaign.slides.length > 0 
          ? campaign.slides.map((s) => ({ ...s, _id: s._id }))
          : [{ tempId: 'default-' + Date.now(), title: "", subtitle: "", link: "", image: "", order: 0 }],
        isActive: campaign.isActive,
      });
    } else if (!isEdit) {
      setFormData({
        name: "",
        description: "",
        slides: [{ tempId: 'default-' + Date.now(), title: "", subtitle: "", link: "", image: "", order: 0 }],
        isActive: false,
      });
    }
  }, [isEdit, id, campaign]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const mainSlide = formData.slides[0];
    if (!mainSlide?.image) {
      return swalError(
        "Missing Image",
        "Please upload a banner image for the first slide.",
      );
    }

    setIsSaving(true);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("isActive", formData.isActive ? "true" : "false");

    const slidesForJSON = [];
    const filesToSend = [];

    formData.slides.forEach((slide) => {
      const slideId = slide._id || slide.tempId;
      const file = slideFiles[slideId];
      const copy = { ...slide };
      if (file && (!slide.image || slide.image.startsWith("blob:"))) {
        copy.fileId = slideId;
        delete copy.image;
        filesToSend.push(file);
      }
      slidesForJSON.push(copy);
    });

    formDataToSend.append("slides", JSON.stringify(slidesForJSON));
    filesToSend.forEach((file) => formDataToSend.append("slideImages", file));

    try {
      if (isEdit) {
        await updateCampaign({ id, formData: formDataToSend });
        swalToast("Banner campaign updated successfully", "success");
      } else {
        await createCampaign(formDataToSend);
        swalToast("Banner campaign created successfully", "success");
      }
      setTimeout(() => router.push("/admin/banner-campaigns"), 1200);
    } catch (err) {
      swalError(
        "Save Failed",
        err.response?.data?.message || "Could not save banner campaign.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isEdit && isCampaignLoading) {
    return (
      <div className="admin-page-container flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  return (
    <AdminPageContainer maxWidth="max-w-7xl">
      <AdminBackLink href="/admin/banner-campaigns" label="Back to Banner Campaigns" />
      <AdminPageHeader
        title={isEdit ? `Edit Campaign: ${campaign?.name || ""}` : "New Banner Campaign"}
        description={isEdit ? "Update banner slides, typography overlays, and target URLs" : "Design a new hero carousel banner for your storefront"}
      />

      <BannerCampaignForm
        formData={formData}
        setFormData={setFormData}
        slideFiles={slideFiles}
        setSlideFiles={setSlideFiles}
        isEdit={isEdit}
        isSaving={isSaving}
        onSubmit={handleSubmit}
      />
    </AdminPageContainer>
  );
}
