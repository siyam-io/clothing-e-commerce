"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  MouseSensor, 
  TouchSensor,
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Price } from "@/components/common/Price";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Maximize2, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Layout, 
  Save, 
  RefreshCcw,
  Zap,
  ShoppingBag,
  Grid,
  LayoutGrid,
  Tag,
  ArrowRight,
  Type,
  Sparkles,
  Percent,
  Star,
  ShieldCheck,
  List,
  Copy,
  LayoutTemplate,
  Search,
  X,
  Check,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fetchAllHomeLayouts, 
  fetchActiveHomeLayout, 
  updateHomeLayout, 
  createHomeLayout, 
  activateHomeLayout, 
  deleteHomeLayout, 
  fetchBannerCampaigns, 
  fetchSubcategories, 
  fetchAdminFlashSales, 
  fetchAdminProducts 
} from "@/app/admin/settings/lib/settings";
import { useAdminCategories } from "@/app/admin/categories/lib/useAdminCategories";
import { notify } from "@/utils/swal";

/**
 * 🏗️ Architect Sortable Section Item
 */
function SortableSection({ section, onToggleVisibility, onRemove, onUpdateConfig, categories = [], subcategories = [], campaigns = [] }) {
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0
  };

  const getIcon = (type) => {
    switch (type) {
      case 'USP': return <Zap size={18} />;
      case 'FLASH_SALE': return <ShoppingBag size={18} />;
      case 'CATEGORY_GRID': return <Grid size={18} />;
      case 'FEATURED_PRODUCTS': return <LayoutGrid size={18} />;
      case 'NEW_ARRIVALS': return <Tag size={18} />;
      case 'SALE_PRODUCTS': return <Tag size={18} />;
      case 'FEATURED_CATEGORY_SECTION': return <Layout size={18} />;
      case 'PROMO_BANNER': return <Maximize2 size={18} />;
      case 'BANNER_SLIDER': return <Layers size={18} />;
      case 'HEADER': return <Type size={18} />;
      case 'CUSTOM_PRODUCTS': return <ShoppingBag size={18} />;
      default: return <Layout size={18} />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-card border border-border/50 rounded-[1.5rem] md:rounded-[2.5rem] transition-all duration-300",
        isDragging ? "shadow-2xl border-primary/40 bg-accent/5" : "hover:border-primary/20",
        !section.isVisible && "opacity-50 grayscale-[50%]"
      )}
    >
      <div className="flex items-center gap-2 md:gap-4 p-3 md:p-4">
        <div 
          {...attributes} 
          {...listeners} 
          className="shrink-0 cursor-grab active:cursor-grabbing p-1 md:p-2 text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical size={20} />
        </div>

        <div className={cn("shrink-0 p-2 md:p-3 rounded-lg md:rounded-xl", section.isVisible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
          {getIcon(section.type)}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-foreground flex items-center gap-2 truncate">
            <span className="truncate">{section.title || section.type.replace(/_/g, ' ')}</span>
            {(section.config?.categoryName || section.config?.campaignName || section.config?.saleName || section.config?.subcategoryId) && (
              <Badge variant="outline" className="hidden sm:inline-flex text-[8px] font-bold h-4 bg-muted/50 shrink-0">
                {section.config.categoryName || 
                 section.config.campaignName || 
                 section.config.saleName}
              </Badge>
            )}
          </h4>
          <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 truncate">
            {section.subtitle || "Default Header Logic"}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-0.5 md:gap-1 ml-1 md:ml-2">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className={cn("h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl", isEditing && "bg-primary text-primary-foreground")}>
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onToggleVisibility(section.id)} className={cn("h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl", section.isVisible ? "text-primary" : "text-muted-foreground")}>
            {section.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onRemove(section.id)} className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl hover:text-destructive transition-all opacity-0 group-hover:opacity-100 sm:opacity-100">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="p-4 md:p-6 border-t border-border/50 bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-6">
            {section.type === 'HEADER' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Main Heading (English)</label>
                  <input
                    type="text"
                    value={section.title || ''}
                    onChange={(e) => onUpdateConfig(section.id, { title: e.target.value }, true)}
                    className="w-full bg-background border border-border/50 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-primary/40 outline-none"
                    placeholder="Enter English Title"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary">Main Heading (Bangla)</label>
                  <input
                    type="text"
                    value={section.titleBn || ''}
                    onChange={(e) => onUpdateConfig(section.id, { titleBn: e.target.value }, true)}
                    className="w-full bg-background border border-primary/20 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-primary/40 outline-none font-bn"
                    placeholder="বাংলা শিরোনাম দিন"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subtitle (English)</label>
                  <input
                    type="text"
                    value={section.subtitle || ''}
                    onChange={(e) => onUpdateConfig(section.id, { subtitle: e.target.value }, true)}
                    className="w-full bg-background border border-border/50 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-primary/40 outline-none"
                    placeholder="Enter English Subtitle"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary">Subtitle (Bangla)</label>
                  <input
                    type="text"
                    value={section.subtitleBn || ''}
                    onChange={(e) => onUpdateConfig(section.id, { subtitleBn: e.target.value }, true)}
                    className="w-full bg-background border border-primary/20 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-primary/40 outline-none font-bn"
                    placeholder="বাংলা সাবটাইটেল দিন"
                  />
                </div>

              </div>
            )}

            {section.type === 'FLASH_SALE' && (
              <div className="pt-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
                  This section will automatically display all active products from the selected Flash Sale campaign.
                </p>
              </div>
            )}

            {(section.type === 'PROMO_BANNER' || section.type === 'HERO' || section.type === 'BANNER_SLIDER') && (
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action Link</label>
                    <input
                      type="text"
                      value={section.actionLink || ''}
                      onChange={(e) => onUpdateConfig(section.id, { actionLink: e.target.value }, true)}
                      className="w-full bg-background border border-border/50 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-primary/40 outline-none"
                      placeholder="/products?category=..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Button Text</label>
                    <input
                      type="text"
                      value={section.buttonText || ''}
                      onChange={(e) => onUpdateConfig(section.id, { buttonText: e.target.value }, true)}
                      className="w-full bg-background border border-border/50 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-primary/40 outline-none"
                      placeholder="Shop Now"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary">Banner Images (Multi-Slide)</label>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 px-3 text-[8px] font-black uppercase tracking-widest rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => {
                        const newImages = [...(section.images || []), ""];
                        onUpdateConfig(section.id, { images: newImages }, true);
                      }}
                    >
                      <Plus size={10} className="mr-1" /> Add Slide
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {(section.images || []).length === 0 && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground opacity-60">Single Image Fallback (Legacy)</label>
                        <input
                          type="text"
                          value={section.imageUrl || ''}
                          onChange={(e) => onUpdateConfig(section.id, { imageUrl: e.target.value }, true)}
                          className="w-full bg-background border border-border/50 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-primary/40 outline-none"
                          placeholder="Enter Image URL"
                        />
                      </div>
                    )}
                    {(section.images || []).map((imgObj, idx) => {
                      const isObject = typeof imgObj === 'object' && imgObj !== null;
                      const imgSrc = isObject ? imgObj.image : imgObj;
                      const imgLink = isObject ? imgObj.link : "";

                      return (
                        <div key={idx} className="space-y-2 p-4 rounded-2xl bg-muted/20 border border-border/50 animate-in fade-in slide-in-from-left-2 duration-300">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-black uppercase text-primary">Slide {idx + 1}</span>
                             <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-lg"
                              onClick={() => {
                                const newImages = section.images.filter((_, i) => i !== idx);
                                onUpdateConfig(section.id, { images: newImages }, true);
                              }}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold uppercase text-muted-foreground ml-1">Image URL</label>
                              <input
                                type="text"
                                value={imgSrc}
                                onChange={(e) => {
                                  const newImages = [...section.images];
                                  newImages[idx] = { image: e.target.value, link: imgLink };
                                  onUpdateConfig(section.id, { images: newImages }, true);
                                }}
                                className="w-full bg-background border border-border/50 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-primary/40 outline-none"
                                placeholder="Enter Image URL"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold uppercase text-muted-foreground ml-1">Action Link</label>
                              <input
                                type="text"
                                value={imgLink}
                                onChange={(e) => {
                                  const newImages = [...section.images];
                                  newImages[idx] = { image: imgSrc, link: e.target.value };
                                  onUpdateConfig(section.id, { images: newImages }, true);
                                }}
                                className="w-full bg-background border border-border/50 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-primary/40 outline-none"
                                placeholder="/products/category-name"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {section.type === 'CUSTOM_PRODUCTS' && (
               <div className="space-y-6 pt-2">
                  <ProductPicker 
                    selectedIds={section.config?.productIds || []} 
                    onUpdate={(ids) => onUpdateConfig(section.id, { productIds: ids })} 
                  />
               </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 🔍 Product Picker for Custom Collections
 */
function ProductPicker({ selectedIds = [], onUpdate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSelected, setIsLoadingSelected] = useState(false);

  const searchProducts = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await fetchAdminProducts({ search: term, limit: 10 });
      setResults(data.products || []);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 🛍️ Fetch details for selected products
  useEffect(() => {
    const fetchSelected = async () => {
      if (selectedIds.length === 0) {
        setSelectedProducts([]);
        return;
      }
      setIsLoadingSelected(true);
      try {
        const data = await fetchAdminProducts({ ids: selectedIds.join(','), limit: 100 });
        setSelectedProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch selected products", error);
      } finally {
        setIsLoadingSelected(false);
      }
    };
    fetchSelected();
  }, [selectedIds]);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchProducts]);

  const toggleProduct = (productId) => {
    const newIds = selectedIds.includes(productId)
      ? selectedIds.filter(id => id !== productId)
      : [...selectedIds, productId];
    onUpdate(newIds);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          placeholder="Search products to add..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-background border border-border/50 rounded-xl pl-12 pr-4 py-3 text-[11px] font-bold focus:border-primary/40 outline-none"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="bg-background border border-border/50 rounded-2xl overflow-hidden shadow-xl max-h-60 overflow-y-auto">
          {results.map(product => (
            <div 
              key={product._id} 
              onClick={() => toggleProduct(product._id)}
              className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer border-b border-border/10 last:border-0 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/50">
                <img src={product.images?.[0] || '/placeholder.png'} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate">{product.name}</p>
                <div className="flex items-center gap-1 text-[8px] text-muted-foreground font-medium uppercase">
                  <span>{product.category?.name}</span>
                  <span>•</span>
                  <Price amount={product.price} />
                </div>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                selectedIds.includes(product._id) ? "bg-primary border-primary text-primary-foreground" : "border-border"
              )}>
                {selectedIds.includes(product._id) && <Check size={12} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border/50">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            Selected Products <Badge variant="secondary" className="text-[8px] h-4">{selectedIds.length}</Badge>
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {selectedProducts.map(product => (
                <div key={product._id} className="group relative flex items-center gap-3 p-2 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all">
                   <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border/50">
                      <img src={product.images?.[0] || '/placeholder.png'} alt="" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold truncate">{product.name}</p>
                      <Price
                        amount={product.price}
                        className="text-[7px] text-muted-foreground font-black uppercase"
                      />
                   </div>
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProduct(product._id);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                   >
                      <X size={10} />
                   </button>
                </div>
             ))}
             {isLoadingSelected && (
                <div className="flex items-center gap-2 p-2">
                   <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                   <span className="text-[8px] font-bold text-muted-foreground uppercase">Refreshing selections...</span>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_LAYOUT = [
  { id: 'banner-default', type: 'PROMO_BANNER', isVisible: true, title: '', subtitle: '', imageUrl: '', actionLink: '', config: {} },
  { id: 'grid-default', type: 'CATEGORY_GRID', isVisible: true, title: '', subtitle: '', imageUrl: '', actionLink: '', config: {} },
  { id: 'new-arrivals', type: 'NEW_ARRIVALS', isVisible: true, title: '', subtitle: '', imageUrl: '', actionLink: '', config: {} },
];

export default function LayoutBuilderPage() {
  const queryClient = useQueryClient();
  const { categories, isLoading: isCatLoading } = useAdminCategories();
  const [selectedLayoutId, setSelectedLayoutId] = useState(null);
  const [prevArchitectures, setPrevArchitectures] = useState(null);
  const [layout, setLayout] = useState([]);
  const [prevRemoteLayout, setPrevRemoteLayout] = useState(null);

  // 🏛️ Fetch all architectures
  const { data: architectures = [], isLoading: isArchLoading } = useQuery({
    queryKey: ['architectures'],
    queryFn: fetchAllHomeLayouts,
  });

  if (architectures !== prevArchitectures) {
    setPrevArchitectures(architectures);
    if (architectures.length > 0 && !selectedLayoutId) {
      const active = architectures.find(a => a.isActive);
      if (active) setSelectedLayoutId(active._id);
    }
  }

  // 🏗️ Fetch specific selected layout
  const { data: remoteLayout, isLoading: isLayoutLoading } = useQuery({
    queryKey: ['homeLayout', selectedLayoutId],
    enabled: !isArchLoading, // Wait for architectures to load first to determine active ID
    queryFn: async () => {
      if (!selectedLayoutId) {
        // If no ID, try to get the active one directly
        const data = await fetchActiveHomeLayout();
        return data?.sections || DEFAULT_LAYOUT;
      }
      
      // If we have an ID, use it from architectures or fetch all and find
      const found = architectures.find(l => l._id === selectedLayoutId);
      if (found) return found.sections;

      const allLayouts = await fetchAllHomeLayouts();
      const foundRemote = allLayouts.find(l => l._id === selectedLayoutId);
      return foundRemote?.sections || DEFAULT_LAYOUT;
    }
  });

  if (remoteLayout !== prevRemoteLayout) {
    setPrevRemoteLayout(remoteLayout);
    if (remoteLayout) setLayout(remoteLayout);
  }

  const { data: campaigns = [], isLoading: isCampLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const data = await fetchBannerCampaigns();
      return data.campaigns || [];
    }
  });

  const { data: subcategories = [], isLoading: isSubLoading } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      const data = await fetchSubcategories();
      return data.subcategories || [];
    }
  });

  const { data: flashSales = [], isLoading: isFlashLoading } = useQuery({
    queryKey: ['admin-flash-sales'],
    queryFn: async () => {
      const data = await fetchAdminFlashSales();
      return data.flashSales || [];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (sections) => {
        if (!selectedLayoutId) return;
        return await updateHomeLayout(selectedLayoutId, sections);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['homeLayout', selectedLayoutId]);
      queryClient.invalidateQueries(['architectures']);
      notify.success("Layout saved successfully");
    },
    onError: () => notify.error("Error", "Could not save layout.")
  });

  const createMutation = useMutation({
    mutationFn: createHomeLayout,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['architectures']);
      const layoutId = data?._id || data?.data?._id;
      if (layoutId) setSelectedLayoutId(layoutId);
      notify.success("New layout version created");
    }
  });

  const activateMutation = useMutation({
    mutationFn: activateHomeLayout,
    onSuccess: () => {
      queryClient.invalidateQueries(['architectures']);
      queryClient.invalidateQueries(['homeLayout']);
      notify.success("Layout activated successfully");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHomeLayout,
    onSuccess: () => {
      queryClient.invalidateQueries(['architectures']);
      notify.info("Layout deleted");
    }
  });


  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleVisibility = useCallback((id) => {
    setLayout(prev => prev.map(item => item.id === id ? { ...item, isVisible: !item.isVisible } : item));
  }, []);

  const removeSection = useCallback((id) => {
    setLayout(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateSectionConfig = useCallback((id, newConfig, isRoot = false) => {
    setLayout(prev => prev.map(item => {
      if (item.id === id) {
        if (isRoot) return { ...item, ...newConfig };
        return { ...item, config: { ...item.config, ...newConfig } };
      }
      return item;
    }));
  }, []);

  const addNewSection = useCallback((type, config = {}) => {
    const newId = `${type.toLowerCase()}-${Date.now()}`;
    const newSection = {
      id: newId,
      type: type,
      title: config.title || "",
      subtitle: config.subtitle || "",
      imageUrl: config.imageUrl || "",
      actionLink: config.actionLink || "",
      isVisible: true,
      images: [],
      config: config
    };
    setLayout(prev => [...prev, newSection]);
    notify.success(`${type.replace(/_/g, ' ')} Added`);
  }, []);

  const resetLayout = () => {
    if (remoteLayout) {
      setLayout(remoteLayout);
      notify.info("Layout Reset");
    }
  };

  // 🛡️ Consolidated Loading State
  const isInitialSync = isArchLoading || isLayoutLoading || isSubLoading || isFlashLoading || isCatLoading;

  if (isInitialSync) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
          <div className="absolute top-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="flex flex-col items-center">
           <p className="text-sm font-semibold text-muted-foreground">Loading layout settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🏛️ Architecture Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 bg-card/70 p-6 rounded-2xl border border-border/60 backdrop-blur-md shadow-2xs">
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                {architectures.map(arch => (
                    <button
                        key={arch._id}
                        onClick={() => setSelectedLayoutId(arch._id)}
                        className={cn(
                            "group relative px-6 py-3 rounded-2xl text-xs font-semibold tracking-wide border transition-all flex items-center gap-3",
                            selectedLayoutId === arch._id 
                                ? "bg-foreground text-background border-foreground shadow-2xl scale-105" 
                                : "bg-background/50 border-border/10 text-muted-foreground hover:border-primary/40 hover:bg-background"
                        )}
                    >
                        <LayoutTemplate size={14} className={cn(selectedLayoutId === arch._id ? "text-background" : "text-primary")} />
                        {arch.name}
                        {arch.isActive && (
                          <div className="flex items-center gap-1.5 ml-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">LIVE</span>
                          </div>
                        )}
                        {selectedLayoutId === arch._id && (
                          <motion.div layoutId="active-arch" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                        )}
                    </button>
                ))}
                
                <button 
                    onClick={() => {
                        const name = prompt("Enter a name for this new layout version:");
                        if (name) createMutation.mutate(name);
                    }}
                    className="px-6 py-3 rounded-2xl text-xs font-semibold tracking-wide border border-dashed border-primary/40 text-primary hover:bg-primary/10 transition-all flex items-center gap-3"
                >
                    <Plus size={14} /> Create Layout
                </button>
            </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {selectedLayoutId && architectures.find(a => a._id === selectedLayoutId && !a.isActive) && (
             <Button 
                onClick={() => activateMutation.mutate(selectedLayoutId)}
                className="rounded-xl h-14 px-8 font-bold text-xs uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-500/20 group"
             >
                <Zap size={16} className="mr-3 group-hover:scale-125 transition-transform" />
                Make Live
             </Button>
          )}
          
          <Button variant="outline" onClick={resetLayout} className="rounded-xl h-14 px-6 font-bold text-xs uppercase tracking-wider border-border/20 hover:bg-muted transition-all">
            <RefreshCcw size={16} className="mr-3" /> Reset
          </Button>

          <Button onClick={() => updateMutation.mutate(layout)} disabled={updateMutation.isPending} className="rounded-xl h-14 px-10 font-bold text-xs uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-all shadow-xl">
            {updateMutation.isPending ? <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin mr-3" /> : <Save size={16} className="mr-3" />}
            {updateMutation.isPending ? "Saving..." : "Save Layout"}
          </Button>

          {selectedLayoutId && architectures.find(a => a._id === selectedLayoutId && !a.isActive) && (
             <Button 
                onClick={async () => {
                    const confirmed = await notify.confirm("Delete this layout version?", "This layout version will be permanently deleted.");
                    if(confirmed) deleteMutation.mutate(selectedLayoutId);
                }}
                variant="ghost"
                size="icon"
                className="h-14 w-14 rounded-xl text-destructive hover:bg-destructive/10 border border-destructive/10"
             >
                <Trash2 size={20} />
             </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-elevated border border-border/50 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-12 shadow-2xl">
            <header className="mb-8 md:mb-10 flex items-center justify-between gap-4 border-b border-border/50 pb-6">
               <div className="flex flex-col gap-1">
                 <span className="text-xs font-semibold text-muted-foreground">Drag and drop to reorder sections</span>
               </div>
               <Badge variant="outline" className="w-fit rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
                 {layout.length} Sections
               </Badge>
             </header>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={layout.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {layout.map((section) => (
                    <SortableSection 
                      key={section.id} 
                      section={section} 
                      onToggleVisibility={toggleVisibility} 
                      onRemove={removeSection} 
                      onUpdateConfig={updateSectionConfig} 
                      categories={categories} 
                      subcategories={subcategories}
                      campaigns={campaigns} 
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="space-y-6 order-first lg:order-last">
          <div className="bg-card border border-border/50 rounded-[2rem] p-6 md:p-8 shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground mb-6 md:mb-8">Component Gallery</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {[
                { type: 'HEADER', label: 'Typography Block', desc: 'Custom Title & Subtitle' },
                { type: 'BANNER_SLIDER', label: 'Premium Banner Slider', desc: 'Auto-sliding multi-image banner' },
                { type: 'CATEGORY_GRID', label: 'Category Matrix', desc: 'Curated groups' },
                { type: 'CUSTOM_PRODUCTS', label: 'Custom Collection', desc: 'Pick specific products' },
              ].map((comp) => (
                <button key={comp.type} onClick={() => addNewSection(comp.type)} className="group flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all text-left">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-foreground">{comp.label}</h5>
                    <p className="text-[8px] font-bold text-muted-foreground">{comp.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-border/50">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">System Blocks</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {/* Global Collections */}
                {[
                  { id: 'NEW_ARRIVALS', name: 'New Arrivals', icon: <Sparkles size={12} /> },
                  { id: 'FEATURED_PRODUCTS', name: 'Featured Products', icon: <Star size={12} /> }
                ].map((item) => (
                  <button key={item.id} onClick={() => addNewSection(item.id)} className="flex items-center gap-3 p-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group">
                    <div className="shrink-0 w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary ml-1">
                      {item.icon}
                    </div>
                    <span className="text-[9px] font-black uppercase truncate flex-1">{item.name}</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity mr-2" />
                  </button>
                ))}

                {/* Database Categories */}
                {categories.map((cat) => (
                  <button 
                    key={cat._id} 
                    onClick={() => addNewSection('CATEGORY_COLLECTION', { categoryId: cat._id, slug: cat.slug, title: cat.name })} 
                    className="flex items-center gap-3 p-2 rounded-xl border border-border/50 bg-background hover:bg-primary/5 transition-all group"
                  >
                    <div className="shrink-0 w-5 h-5 rounded-md bg-muted flex items-center justify-center text-muted-foreground ml-1">
                      <LayoutGrid size={12} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[9px] font-black uppercase truncate">{cat.name}</p>
                      <p className="text-[6px] font-bold uppercase text-primary/40 tracking-tighter">Infrastructure Node</p>
                    </div>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity mr-2" />
                  </button>
                ))}
              </div>
            </div>


            <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-border/50">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Quick-Deploy Subcategories</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {subcategories.map((sub) => (
                  <button 
                    key={sub._id} 
                    onClick={() => addNewSection('CATEGORY_COLLECTION', { subcategoryId: sub._id, slug: sub.slug, title: sub.name })} 
                    className="flex items-center gap-3 p-2 rounded-xl border border-border/50 bg-background hover:bg-rose-500/5 transition-all group"
                  >
                    <div className="shrink-0 w-5 h-5 rounded-md bg-muted flex items-center justify-center text-muted-foreground ml-1">
                      <List size={12} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[9px] font-black uppercase truncate">{sub.name}</p>
                      <p className="text-[6px] font-bold uppercase text-rose-500/40 tracking-tighter">{sub.category?.name}</p>
                    </div>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity mr-2" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-border/50">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Quick-Deploy Flash Sales</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {flashSales.length > 0 ? (
                  flashSales.map((sale) => (
                    <button key={sale._id} onClick={() => addNewSection('FLASH_SALE', { saleId: sale._id, saleName: sale.name, title: sale.name })} className="flex items-center gap-4 p-3 rounded-2xl border border-border/50 bg-background hover:bg-primary/5 transition-all text-left">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                        <ShoppingBag size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase truncate">{sale.name}</p>
                        <p className="text-[7px] font-bold uppercase text-rose-500 tracking-widest opacity-70">Deploy Sale</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-border text-center w-full">
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">No active campaigns found in protocol</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-border/50">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Quick-Deploy Campaigns</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {campaigns.map((camp) => (
                  <button key={camp._id} onClick={() => addNewSection('PROMO_BANNER', { campaignId: camp._id, campaignName: camp.name, title: camp.name, imageUrl: camp.slides?.[0]?.image || camp.imageUrl || "" })} className="flex items-center gap-4 p-3 rounded-2xl border border-border/50 bg-background hover:bg-primary/5 transition-all text-left">
                    <div className="shrink-0 w-14 h-10 rounded-xl overflow-hidden bg-muted border border-border/50">
                      {camp.slides?.[0]?.image ? <img src={camp.slides[0].image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10"><Plus size={12} className="text-primary/40" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase truncate">{camp.name}</p>
                      <p className="text-[7px] font-bold uppercase text-primary tracking-widest opacity-70">Deploy Banner</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
