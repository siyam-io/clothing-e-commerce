"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useReviews } from "../lib/useReviews";
import { useRouter } from "next/navigation";
import StarRating from "./StarRating";
import Loader from "@/components/common/Loader";
import { getImageUrl } from "@/utils/imageUtils";
import { notify } from "@/utils/swal";
import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, X, Trash2, Edit3, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ReviewSkeleton = () => (
  <Card className="p-8 rounded-[2.5rem] bg-background border-border/40 shadow-xl shadow-black/5 h-full flex flex-col gap-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="space-y-3 flex-1">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[90%]" />
      <Skeleton className="h-4 w-[80%]" />
    </div>
    <div className="flex gap-3 pt-6 border-t border-border/10">
      <Skeleton className="w-14 h-16 rounded-xl" />
      <Skeleton className="w-14 h-16 rounded-xl" />
    </div>
  </Card>
);

const DICTIONARY = {
  en: {
    title: "Community Feedback",
    reviews: "Reviews",
    writeBtn: "Leave a Review",
    loginToReview: "Sign in to share your experience",
    yourReview: "Your Review",
    edited: "Edited",
    editBtn: "Edit",
    deleteBtn: "Delete",
    editTitle: "Update Your Experience",
    writeTitle: "Share Your Experience",
    ratingLabel: "Your Rating",
    reviewLabel: "Your Review",
    placeholder: "Describe your aesthetic and comfort experience...",
    addPhotos: "Add Visuals (Max 5)",
    photoLimit: "JPG, PNG, WebP up to 5MB.",
    submitBtn: "Publish Feedback",
    updateBtn: "Update Feedback",
    cancelBtn: "Cancel",
    saving: "Processing...",
    noReviews: "No feedback yet. Be the first to review.",
    success: "Feedback published successfully!",
    error: "Action failed. Please try again.",
    confirmDelete: "Remove this feedback permanently?",
    prev: "Previous",
    next: "Next",
    page: "Page",
    overallRating: "Overall Rating",
    reports: "Reports",
    score: "Score",
  },
  bn: {
    title: "কমিউনিটি ফিডব্যাক",
    reviews: "টি রিভিউ",
    writeBtn: "রিভিউ লিখুন",
    loginToReview: "রিভিউ লিখতে লগইন করুন",
    yourReview: "আপনার রিভিউ",
    edited: "এডিটেড",
    editBtn: "এডিট",
    deleteBtn: "ডিলিট",
    editTitle: "আপনার অভিজ্ঞতা আপডেট করুন",
    writeTitle: "আপনার অভিজ্ঞতা শেয়ার করুন",
    ratingLabel: "আপনার রেটিং",
    reviewLabel: "মতামত",
    placeholder: "এই প্রোডাক্টটি সম্পর্কে আপনার অভিজ্ঞতা লিখুন...",
    addPhotos: "ছবি যোগ করুন (সর্বোচ্চ ৫টি)",
    photoLimit: "সর্বোচ্চ ৫ মেগাবাইট। JPG, PNG, WebP.",
    submitBtn: "পাবলিশ করুন",
    updateBtn: "আপডেট করুন",
    cancelBtn: "বাতিল করুন",
    saving: "প্রসেসিং হচ্ছে...",
    noReviews: "কোনো ফিডব্যাক নেই। আপনিই প্রথম রিভিউ দিন!",
    success: "ফিডব্যাক সফলভাবে পাবলিশ হয়েছে!",
    error: "দুঃখিত, আবার চেষ্টা করুন।",
    confirmDelete: "এই রিভিউটি কি মুছে ফেলতে চান?",
    prev: "আগের",
    next: "পরের",
    page: "পেজ",
    overallRating: "ওভারঅল রেটিং",
    reports: "রিপোর্টস",
    score: "স্কোর",
  },
};

export default function ReviewSection({ productId, onReviewChange }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const {
    reviews,
    userReview,
    averageRating,
    totalReviews,
    total,
    pages,
    isLoading,
    createReview,
    updateReview,
    deleteReview,
  } = useReviews(productId, currentPage, 5);

  const { lang, settings } = useAppStore();
  const siteName = settings?.branding?.siteName || "Store";
  const ui = useMemo(() => {
    const base = DICTIONARY[lang] || DICTIONARY["en"];
    return {
      ...base,
      noReviews: lang === 'bn' 
        ? "কোনো ফিডব্যাক নেই। আপনিই প্রথম রিভিউ দিন!" 
        : `No feedback yet. Be the ${siteName.toLowerCase()}.`
    };
  }, [lang, siteName]);
  const isBn = lang === "bn";

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userReview && isEditing) {
      setRating(userReview.rating || 5);
      setComment(userReview.comment || "");
      if (userReview.images)
        setImagePreviews(userReview.images.map((img) => getImageUrl(img.url)));
    }
  }, [userReview, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setShowForm(true);
  };
  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setRating(5);
    setComment("");
    setImages([]);
    setImagePreviews([]);
    setImagesToRemove([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      return notify.error(
        "Limit Exceeded",
        "Maximum 5 images allowed per review."
      );
    }
    setImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeImage = (index, isExisting = false, existingUrl = null) => {
    if (isExisting && existingUrl) {
      setImagesToRemove((prev) => [...prev, existingUrl]);
    } else {
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim())
      return notify.error(
        "Missing Comment",
        "Please write a brief description of your experience."
      );

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("rating", Number(rating));
    formData.append("comment", comment.trim());
    images.forEach((image) => formData.append("images", image));
    if (imagesToRemove.length > 0)
      formData.append("removeImages", JSON.stringify(imagesToRemove));

    try {
      if (userReview && isEditing) {
        await updateReview({ reviewId: userReview._id, data: formData });
        notify.success("Feedback Updated");
      } else {
        await createReview(formData);
        notify.success("Feedback Published");
      }
      handleCancel();
      if (onReviewChange) onReviewChange();
    } catch (error) {
      notify.error(
        "Publication Failed",
        error.response?.data?.message || ui.error
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await notify.confirm(
      ui.confirmDelete,
      "This action is irreversible."
    );
    if (confirmed) {
      try {
        await deleteReview(userReview._id);
        notify.success("Feedback Removed");
        if (onReviewChange) onReviewChange();
      } catch (error) {
        notify.error("Delete Error", "Could not remove the feedback.");
      }
    }
  };

  // Initial loading is handled by wrapper if needed, but we want skeletons for pagination

  return (
    <div className="space-y-24">
      {/* Header & Impact Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
        <div className="space-y-4">
          <h3 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-foreground leading-[0.8]">
            {ui.title}
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
               <StarRating rating={Number(averageRating) || 0} size="medium" />
               <p className="text-[10px] font-black text-accent-secondary uppercase tracking-[0.4em]">
                 {totalReviews || 0} {ui.reports}
               </p>
            </div>
            <div className="h-10 w-px bg-border/30" />
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-black italic">
                 {typeof averageRating === 'number' ? averageRating.toFixed(1) : "0.0"}
               </span>
               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{ui.score}</span>
            </div>
          </div>
        </div>
        {!userReview && !showForm && (
          <Button
            size="xl"
            onClick={() => (user ? setShowForm(true) : router.push("/login"))}
            className="rounded-full bg-foreground text-background hover:bg-accent-secondary hover:text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-foreground/10 px-12 h-16"
          >
            {user ? (
              <span className="flex items-center gap-3">
                <MessageSquare size={18} />
                {ui.writeBtn}
              </span>
            ) : ui.loginToReview}
          </Button>
        )}
      </div>

      {/* User's Vaulted Feedback */}
      {userReview && !showForm && (
        <Card className="rounded-[3rem] bg-accent/20 border-none shadow-2xl relative overflow-hidden group animate-in fade-in zoom-in-95 duration-700">
          <div className="absolute top-0 left-0 w-2 h-full bg-accent-secondary" />
          <CardContent className="p-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12">
              <div className="flex-1 space-y-8">
                <div className="flex items-center gap-4">
                  <StarRating rating={userReview.rating} size="medium" />
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.3em] border-accent-secondary text-accent-secondary py-1 px-4 rounded-full bg-accent-secondary/5">
                    {ui.yourReview}
                  </Badge>
                  {userReview.isEdited && (
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-50 italic">
                      {ui.edited}
                    </span>
                  )}
                </div>
                <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium italic">
                  "{userReview.comment}"
                </p>
                {userReview.images?.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {userReview.images.map((img, idx) => (
                      <div 
                        key={idx}
                        className="relative h-24 w-20 rounded-2xl overflow-hidden border border-border/30 grayscale hover:grayscale-0 transition-all cursor-zoom-in hover:scale-105 shadow-lg shadow-black/10"
                        onClick={() => window.open(getImageUrl(img.url), "_blank")}
                      >
                        <img
                          src={getImageUrl(img.url, 200, 75)}
                          alt="Review Artifact"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                  Logged: {new Date(userReview.createdAt).toDateString()}
                </p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="flex-1 md:flex-none h-14 rounded-2xl border-border/30 bg-background/50 hover:bg-foreground hover:text-background font-black uppercase text-[10px] tracking-widest"
                >
                  <Edit3 size={16} className="mr-3" />
                  {ui.editBtn}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  className="flex-1 md:flex-none h-14 rounded-2xl text-accent-secondary hover:bg-accent-secondary hover:text-white font-black uppercase text-[10px] tracking-widest"
                >
                  <Trash2 size={16} className="mr-3" />
                  {ui.deleteBtn}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Construction Terminal */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.form
            key="reviewForm"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onSubmit={handleSubmit}
            className="p-12 rounded-[3.5rem] glass border-accent-secondary/10 shadow-3xl overflow-hidden space-y-12"
          >
            <div className="flex items-center justify-between border-b border-border/30 pb-8">
               <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground italic">
                {userReview && isEditing ? ui.editTitle : ui.writeTitle}
              </h3>
              <Button variant="ghost" size="icon" onClick={handleCancel} className="rounded-full hover:bg-accent-secondary hover:text-white transition-all">
                <X size={24} />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
               {/* Left: Metadata */}
               <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-accent-secondary uppercase tracking-[0.4em]">
                      {ui.ratingLabel}
                    </label>
                    <div className="bg-accent/20 border border-border/30 inline-block px-8 py-4 rounded-3xl shadow-inner">
                      <StarRating
                        rating={rating}
                        onChange={setRating}
                        editable
                        size="large"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-accent-secondary uppercase tracking-[0.4em]">
                      {ui.addPhotos}
                    </label>
                    <div className="flex flex-wrap gap-4 items-center">
                      <div 
                        className="relative w-28 h-32 rounded-3xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center hover:border-accent-secondary hover:bg-accent-secondary/5 transition-all cursor-pointer bg-accent/20 overflow-hidden group/upload"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <ImagePlus className="h-6 w-6 text-muted-foreground group-hover/upload:text-accent-secondary transition-colors mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover/upload:text-accent-secondary">
                          Upload
                        </span>
                      </div>
                      {imagePreviews.map((preview, idx) => {
                        const isExistingImage = userReview?.images?.some(
                          (img) => getImageUrl(img.url) === preview,
                        );
                        const existingUrl = userReview?.images?.find(
                          (img) => getImageUrl(img.url) === preview,
                        )?.url;
                        return (
                          <div
                            key={idx}
                            className="relative w-28 h-32 rounded-3xl border border-border/30 group/preview overflow-hidden shadow-xl animate-in zoom-in-50 duration-300"
                          >
                            <img
                              src={preview}
                              alt="Preview Artifact"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-110"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx, isExistingImage, existingUrl)}
                              className="absolute inset-0 bg-accent-secondary/90 flex items-center justify-center text-white opacity-0 group-hover/preview:opacity-100 transition-all"
                            >
                              <X size={24} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
               </div>

               {/* Right: Content */}
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-accent-secondary uppercase tracking-[0.4em]">
                    {ui.reviewLabel}
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full h-[240px] bg-accent/20 border-none rounded-[2.5rem] p-8 outline-none text-foreground font-medium transition-all shadow-inner resize-none focus:ring-2 focus:ring-accent-secondary/20 italic placeholder:text-muted-foreground/30 text-lg"
                    placeholder={ui.placeholder}
                    required
                  />
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t border-border/30">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] h-16 rounded-full bg-accent-secondary hover:brightness-110 text-white font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-accent-secondary/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader size="small" />
                ) : (
                  <span className="flex items-center gap-4">
                    <Send size={16} />
                    {userReview && isEditing ? ui.updateBtn : ui.submitBtn}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1 h-16 rounded-full border-border/30 bg-background/50 hover:bg-foreground hover:text-background font-black uppercase tracking-[0.2em] text-[10px]"
              >
                {ui.cancelBtn}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Global Archive Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[...Array(4)].map((_, i) => (
            <ReviewSkeleton key={i} />
          ))}
        </div>
      ) : !userReview && reviews.length === 0 && !showForm ? (
        <div className="text-center py-32 glass rounded-[4rem] border-dashed border-accent-secondary/20 border-2">
          <div className="w-20 h-20 bg-accent/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
             <MessageSquare size={32} className="text-muted-foreground opacity-30" />
          </div>
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.5em] italic">
            {ui.noReviews}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {reviews
            .filter((r) => !userReview || r._id !== userReview._id)
            .map((review, index) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
              >
                <Card className="p-8 rounded-[2.5rem] bg-background border-border/40 hover:border-accent-secondary/30 transition-all duration-700 shadow-xl shadow-black/5 group/card h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 rounded-2xl border-2 border-accent/20 p-0.5">
                        <AvatarImage 
                          src={review.user?.avatar ? getImageUrl(review.user.avatar, 100, 100) : ""} 
                          className="rounded-[0.9rem] grayscale group-hover/card:grayscale-0 transition-all duration-700"
                        />
                        <AvatarFallback className="rounded-[0.9rem] bg-accent font-black text-xs">
                          {review.user?.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground ">
                          {review.user?.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 opacity-60">
                           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            Log: {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="small" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm leading-relaxed mb-8 font-medium italic group-hover/card:text-foreground transition-colors duration-500">
                      "{review.comment}"
                    </p>
                  </div>

                  {review.images?.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-auto pt-6 border-t border-border/10">
                      {review.images.map((img, i) => (
                        <div 
                          key={i}
                          className="w-14 h-16 rounded-xl overflow-hidden border border-border/20 grayscale hover:grayscale-0 transition-all cursor-zoom-in hover:scale-110 shadow-sm"
                          onClick={() => window.open(getImageUrl(img.url), "_blank")}
                        >
                          <img
                            src={getImageUrl(img.url, 150, 150)}
                            alt="Visual Evidence"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-12">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-xl border-border/30 font-black uppercase text-[9px] tracking-widest h-12 px-6"
          >
            {ui.prev}
          </Button>
          <div className="flex items-center gap-2 px-6 h-12 glass rounded-xl">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
              {ui.page}
            </span>
            <span className="text-sm font-black italic text-accent-secondary">
              {currentPage}
            </span>
            <span className="text-[10px] font-black text-muted-foreground/40 italic">
              / {pages}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(pages, prev + 1))}
            disabled={currentPage === pages}
            className="rounded-xl border-border/30 font-black uppercase text-[9px] tracking-widest h-12 px-6"
          >
            {ui.next}
          </Button>
        </div>
      )}
    </div>
  );
}
