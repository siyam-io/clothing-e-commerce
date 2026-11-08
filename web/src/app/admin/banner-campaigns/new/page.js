"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminBannerCampaigns } from "@/app/admin/banner-campaigns/lib/useAdminBannerCampaigns";
import { swalError, swalToast } from "@/utils/swal";
import BannerCampaignForm from "../components/BannerCampaignForm";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";

export default function NewBannerCampaignPage() {
  const router = useRouter();
  const { createCampaign } = useAdminBannerCampaigns();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slides: [
      {
        tempId: "default-" + Date.now(),
        title: "",
        subtitle: "",
        link: "",
        image: "",
        order: 0,
      },
    ],
    isActive: true,
  });

  const [slideFiles, setSlideFiles] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      return swalError("Validation Error", "Please provide a name for this banner campaign.");
    }

    const mainSlide = formData.slides[0];
    if (!mainSlide?.image) {
      return swalError(
        "Missing Banner Image",
        "Please upload a banner image for the first slide to launch this campaign.",
      );
    }

    setIsSaving(true);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name.trim());
    formDataToSend.append("description", formData.description?.trim() || "");
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
      await createCampaign(formDataToSend);
      swalToast("Banner campaign published successfully!", "success");
      setTimeout(() => router.push("/admin/banner-campaigns"), 1000);
    } catch (err) {
      swalError(
        "Save Failed",
        err.response?.data?.message || "Could not create the banner campaign.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminPageContainer maxWidth="max-w-7xl">
      <AdminBackLink href="/admin/banner-campaigns" label="Back to Banner Campaigns" />
      <AdminPageHeader
        title="New Banner Campaign"
        description="Design and publish a high-impact hero slider for your storefront homepage"
      />

      <BannerCampaignForm
        formData={formData}
        setFormData={setFormData}
        slideFiles={slideFiles}
        setSlideFiles={setSlideFiles}
        isEdit={false}
        isSaving={isSaving}
        onSubmit={handleSubmit}
      />
    </AdminPageContainer>
  );
}

