"use client";

import { useState, useEffect } from "react";
import { getImageUrl } from "@/utils/imageUtils";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImageUpload({
  label,
  name,
  register,
  currentImage,
  onImageChange,
  accept = "image/*",
  multiple = false,
  className
}) {
  const [localPreview, setLocalPreview] = useState(null);
  const [localPreviews, setLocalPreviews] = useState(null);

  const preview = localPreview !== null ? localPreview : (currentImage && !multiple ? getImageUrl(currentImage) : null);
  const previews = localPreviews !== null 
    ? localPreviews 
    : (Array.isArray(currentImage) && multiple ? currentImage.map((img) => getImageUrl(img)) : []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (multiple) {
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setLocalPreviews([...previews, ...newPreviews]);
      if (onImageChange) onImageChange(files);
    } else {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLocalPreview(reader.result);
        };
        reader.readAsDataURL(file);
        if (onImageChange) onImageChange(file);
      }
    }
  };

  const removeImage = (index) => {
    if (multiple) {
      const newPreviews = previews.filter((_, i) => i !== index);
      setLocalPreviews(newPreviews);
      if (onImageChange) onImageChange(null);
    } else {
      setLocalPreview("");
      if (onImageChange) onImageChange(null);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">
          {label} { <span className="text-rose-500">*</span>}
        </Label>
      )}

      <div className="relative group">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/20 rounded-[2rem] bg-accent/5 hover:bg-accent/10 hover:border-rose-600/30 transition-all cursor-pointer group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload size={24} className="text-muted-foreground group-hover:text-rose-600 transition-colors mb-2" />
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Initialize Data Upload
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            {...register(name)}
            onChange={handleFileChange}
            multiple={multiple}
          />
        </label>
      </div>

      {/* Preview Section */}
      {(preview || (multiple && previews.length > 0)) && (
        <div className="flex flex-wrap gap-4 mt-4 animate-in fade-in slide-in-from-bottom-2">
          {!multiple && preview && (
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-border/10 shadow-xl group">
              <img src={preview} alt="Preview" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
              <button
                type="button"
                onClick={() => removeImage()}
                className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {multiple && previews.map((img, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border/10 shadow-xl group">
              <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
