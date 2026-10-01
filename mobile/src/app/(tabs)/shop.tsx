/* eslint-disable react-hooks/set-state-in-effect */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArrowUpDown,
  BadgePercent,
  Check,
  ChevronDown,
  Grid2X2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from 'lucide-react-native';

import { useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { api, getImageUrl } from '../../lib/api';
import { ProductCard } from '../../components/ui/ProductCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/appStore';
import { getBrandTokens, withAlpha } from '../../constants/designSystem';

type Category = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
};

type Subcategory = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  category?: string | { _id?: string; name?: string };
};

type Palette = ReturnType<typeof getBrandTokens>;

type Product = {
  _id?: string;
  slug?: string;
  [key: string]: unknown;
};

const sortOptions = [
  { label: 'Newest', value: '' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
];

const currency = '\u09F3';
const PAGE_SIZE = 20;

const MemoProductCard = memo(ProductCard);

const FilterChip = memo(function FilterChip({
  label,
  active,
  onPress,
  icon,
  palette,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  palette: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mr-2 h-10 flex-row items-center gap-1.5 rounded-2xl border px-4 active:scale-95"
      style={{
        backgroundColor: active ? palette.primary : palette.surface,
        borderColor: active ? palette.primary : palette.border,
      }}
    >
      {icon}
      <Text
        className="text-[11px] font-black uppercase tracking-wider"
        style={{ color: active ? palette.onPrimary : palette.textSecondary }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const CategoryCard = memo(function CategoryCard({
  category,
  active,
  onPress,
  palette,
}: {
  category: { name: string; slug: string; image?: string; icon?: React.ReactNode };
  active: boolean;
  onPress: () => void;
  palette: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mr-2 h-14 min-w-[124px] flex-row items-center gap-2 rounded-2xl border px-2 pr-4 active:scale-95"
      style={{
        backgroundColor: active ? palette.primary : palette.surface,
        borderColor: active ? palette.primary : palette.border,
      }}
    >
      <View
        className="h-10 w-10 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: active ? withAlpha(palette.onPrimary, 0.15) : palette.surfaceSoft }}
      >
        {category.image ? (
          <Image source={{ uri: getImageUrl(category.image) }} className="h-full w-full" resizeMode="cover" />
        ) : (
          category.icon
        )}
      </View>
      <Text
        className="max-w-[76px] text-[10px] font-black uppercase tracking-wider"
        style={{ color: active ? palette.onPrimary : palette.text }}
        numberOfLines={2}
      >
        {category.name}
      </Text>
    </Pressable>
  );
});

export default function ShopScreen() {
  const params = useLocalSearchParams();
  const theme = useAppStore((s) => s.theme);
  const palette = getBrandTokens(theme);
  const mutedIconColor = palette.iconMuted;
  const placeholderColor = palette.iconMuted;
  const overlayBg = withAlpha(palette.background, 0.7);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftSubcategory, setDraftSubcategory] = useState('');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftSortBy, setDraftSortBy] = useState('');

  useEffect(() => {
    const category = typeof params.category === 'string' ? params.category : '';
    const subcategory = typeof params.subcategory === 'string' ? params.subcategory : '';

    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setDraftCategory(category);
    setDraftSubcategory(subcategory);
  }, [params.category, params.subcategory]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return Array.isArray(data) ? data : data?.categories || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ['subcategories'],
    queryFn: async () => {
      const { data } = await api.get('/subcategories', { params: { limit: 100 } });
      return data?.subcategories || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const draftCategoryObj = useMemo(
    () => categories.find((cat) => cat.slug === draftCategory),
    [categories, draftCategory],
  );

  const visibleSubcategories = useMemo(() => {
    if (!draftCategoryObj) return subcategories;
    return subcategories.filter((sub) => {
      const catId = typeof sub.category === 'object' ? sub.category?._id : sub.category;
      return String(catId) === String(draftCategoryObj._id);
    });
  }, [draftCategoryObj, subcategories]);

  const activeFilterCount = useMemo(
    () =>
      [selectedCategory, selectedSubcategory, minPrice || maxPrice, sortBy].filter(Boolean)
        .length,
    [maxPrice, minPrice, selectedCategory, selectedSubcategory, sortBy],
  );

  const draftFilterCount = useMemo(
    () =>
      [draftCategory, draftSubcategory, draftMinPrice || draftMaxPrice, draftSortBy].filter(Boolean)
        .length,
    [draftCategory, draftMaxPrice, draftMinPrice, draftSortBy, draftSubcategory],
  );

  const appliedQueryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: selectedCategory && selectedCategory !== 'isFeatured' ? selectedCategory : undefined,
      subcategory: selectedSubcategory || undefined,
      isFeatured: selectedCategory === 'isFeatured' ? 'true' : undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sort: sortBy || undefined,
    }),
    [debouncedSearch, maxPrice, minPrice, selectedCategory, selectedSubcategory, sortBy],
  );

  const fetchProducts = useCallback(
    async ({ pageParam = 1 }) => {
      const { data } = await api.get('/products', {
        params: {
          page: pageParam,
          limit: PAGE_SIZE,
          ...appliedQueryParams,
        },
      });
      return data;
    },
    [appliedQueryParams],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['shopProducts', appliedQueryParams],
    queryFn: fetchProducts,
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage.currentPage || 1);
      const totalPages = Number(lastPage.pages || 1);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
  });

  const productsList = useMemo(() => {
    const seen = new Set<string>();
    const products: Product[] = [];

    data?.pages.forEach((page) => {
      (page.products || []).forEach((product: Product) => {
        const key = String(product?._id || product?.slug || '');
        if (!key || seen.has(key)) return;
        seen.add(key);
        products.push(product);
      });
    });

    return products;
  }, [data]);

  const endReachedLockedRef = useRef(false);

  const openFilters = useCallback(() => {
    setDraftCategory(selectedCategory);
    setDraftSubcategory(selectedSubcategory);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftSortBy(sortBy);
    setIsFilterPanelOpen(true);
  }, [maxPrice, minPrice, selectedCategory, selectedSubcategory, sortBy]);

  const handleDraftCategoryChange = useCallback((slug: string) => {
    setDraftCategory(slug);
    setDraftSubcategory('');
  }, []);

  const handleApplyFilters = useCallback(() => {
    setSelectedCategory(draftCategory);
    setSelectedSubcategory(draftSubcategory);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setSortBy(draftSortBy);
    setIsFilterPanelOpen(false);
  }, [draftCategory, draftMaxPrice, draftMinPrice, draftSortBy, draftSubcategory]);

  const handleClearFilters = useCallback(() => {
    setMinPrice('');
    setMaxPrice('');
    setSortBy('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftSortBy('');
    setDraftCategory('');
    setDraftSubcategory('');
    setSearchTerm('');
    setDebouncedSearch('');
  }, []);

  const handleEndReached = useCallback(() => {
    if (endReachedLockedRef.current || !hasNextPage || isFetchingNextPage) return;
    endReachedLockedRef.current = true;
    fetchNextPage().finally(() => {
      endReachedLockedRef.current = false;
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <MemoProductCard product={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Product) => String(item._id || item.slug), []);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.background }}>
      <View className="border-b px-4 py-3" style={{ backgroundColor: palette.nav, borderColor: palette.border }}>
        <View className="flex-row items-center gap-2">
          <View className="h-12 flex-1 flex-row items-center rounded-2xl border px-3" style={{ backgroundColor: palette.surface, borderColor: palette.border }}>
            <Search size={18} color={palette.iconMuted} />
            <TextInput
              placeholder="Search products"
              placeholderTextColor={placeholderColor}
              className="ml-2 flex-1 py-2 text-sm font-bold"
              style={{ color: palette.text }}
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchTerm ? (
              <Pressable onPress={() => setSearchTerm('')} className="h-8 w-8 items-center justify-center">
                <X size={16} color={palette.iconMuted} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={openFilters}
            className="h-12 w-12 items-center justify-center rounded-2xl active:scale-95"
            style={{ backgroundColor: palette.primary }}
          >
            <SlidersHorizontal size={18} color={palette.onPrimary} strokeWidth={2.3} />
            {activeFilterCount ? (
              <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full px-1" style={{ backgroundColor: palette.danger }}>
                <Text className="text-[9px] font-black" style={{ color: palette.onPrimary }}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <Modal
        visible={isFilterPanelOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterPanelOpen(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: overlayBg }}>
          <Pressable className="flex-1" onPress={() => setIsFilterPanelOpen(false)} />
          <View className="max-h-[82%] rounded-t-[30px] px-4 pb-5 pt-3" style={{ backgroundColor: palette.surface }}>
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-black uppercase tracking-tight" style={{ color: palette.text }}>
                  Filters
                </Text>
                <Text className="text-[11px] font-bold" style={{ color: palette.textSecondary }}>
                  Sort, category, subcategory, price
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={handleClearFilters}
                  className="h-10 flex-row items-center gap-1.5 rounded-2xl px-3 active:scale-95"
                  style={{ backgroundColor: palette.surfaceSoft }}
                >
                  <RotateCcw size={13} color={palette.iconMuted} />
                  <Text className="text-[10px] font-black uppercase tracking-wider" style={{ color: palette.textSecondary }}>
                    Reset
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsFilterPanelOpen(false)}
                  className="h-10 w-10 items-center justify-center rounded-2xl active:scale-95"
                  style={{ backgroundColor: palette.primary }}
                >
                  <ChevronDown size={17} color={palette.onPrimary} strokeWidth={2.3} />
                </Pressable>
              </View>
            </View>

            <ScrollView overScrollMode="never" showsVerticalScrollIndicator={false}>
              <View className="mb-5">
                <Text className="mb-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: palette.textSecondary }}>
                  Sort By
                </Text>
                <ScrollView overScrollMode="never" horizontal showsHorizontalScrollIndicator={false}>
                  {sortOptions.map((option) => {
                    const isSelected = draftSortBy === option.value;
                    return (
                      <Pressable
                        key={option.label}
                        onPress={() => setDraftSortBy(option.value)}
                        className="mr-2 h-11 flex-row items-center gap-2 rounded-2xl border px-4 active:scale-95"
                        style={{
                          backgroundColor: isSelected ? palette.primary : palette.surfaceSoft,
                          borderColor: isSelected ? palette.primary : palette.border,
                        }}
                      >
                        <ArrowUpDown size={13} color={isSelected ? palette.onPrimary : mutedIconColor} />
                        <Text
                          className="text-[10px] font-black uppercase tracking-wider"
                          style={{ color: isSelected ? palette.onPrimary : palette.textSecondary }}
                        >
                          {option.label}
                        </Text>
                        {isSelected ? <Check size={13} color={palette.onPrimary} /> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View className="mb-5">
                <Text className="mb-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: palette.textSecondary }}>
                  Category
                </Text>
                <ScrollView overScrollMode="never" horizontal showsHorizontalScrollIndicator={false}>
                  <CategoryCard
                    category={{ name: 'All', slug: '', icon: <Grid2X2 size={18} color={mutedIconColor} /> }}
                    active={draftCategory === ''}
                    onPress={() => handleDraftCategoryChange('')}
                    palette={palette}
                  />
                  <CategoryCard
                    category={{
                      name: 'Featured',
                      slug: 'isFeatured',
                      icon: <Sparkles size={18} color={palette.warning} />,
                    }}
                    active={draftCategory === 'isFeatured'}
                    onPress={() => handleDraftCategoryChange('isFeatured')}
                    palette={palette}
                  />
                  <CategoryCard
                    category={{
                      name: 'On Sale',
                      slug: 'on-sale',
                      icon: <BadgePercent size={18} color={palette.danger} />,
                    }}
                    active={draftCategory === 'on-sale'}
                    onPress={() => handleDraftCategoryChange('on-sale')}
                    palette={palette}
                  />
                  {categories
                    .filter((cat) => cat.slug !== 'on-sale')
                    .map((cat) => (
                      <CategoryCard
                        key={cat._id}
                        category={cat}
                        active={draftCategory === cat.slug}
                        onPress={() => handleDraftCategoryChange(cat.slug)}
                        palette={palette}
                      />
                    ))}
                </ScrollView>
              </View>

              {visibleSubcategories.length > 0 ? (
                <View className="mb-5">
                  <Text className="mb-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: palette.textSecondary }}>
                    Subcategory
                  </Text>
                  <ScrollView overScrollMode="never" horizontal showsHorizontalScrollIndicator={false}>
                    {visibleSubcategories.map((sub) => (
                      <FilterChip
                        key={sub._id}
                        label={sub.name}
                        active={draftSubcategory === sub.slug}
                        onPress={() => setDraftSubcategory(draftSubcategory === sub.slug ? '' : sub.slug)}
                        icon={
                          <Tag
                            size={12}
                            color={draftSubcategory === sub.slug ? palette.onPrimary : mutedIconColor}
                          />
                        }
                        palette={palette}
                      />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <View className="mb-5">
                <Text className="mb-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: palette.textSecondary }}>
                  Price Range
                </Text>
                <View className="flex-row items-center gap-3">
                  <View className="flex-1 rounded-2xl border px-3 py-2" style={{ backgroundColor: palette.surfaceSoft, borderColor: palette.border }}>
                    <Text className="text-[9px] font-black uppercase tracking-widest" style={{ color: palette.textSecondary }}>
                      Min
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="mr-1 text-sm font-black" style={{ color: palette.textSecondary }}>{currency}</Text>
                      <TextInput
                        placeholder="0"
                        placeholderTextColor={placeholderColor}
                        className="flex-1 py-1 text-base font-black"
                        style={{ color: palette.text }}
                        keyboardType="numeric"
                        value={draftMinPrice}
                        onChangeText={setDraftMinPrice}
                      />
                    </View>
                  </View>

                  <View className="h-0.5 w-4" style={{ backgroundColor: palette.border }} />

                  <View className="flex-1 rounded-2xl border px-3 py-2" style={{ backgroundColor: palette.surfaceSoft, borderColor: palette.border }}>
                    <Text className="text-[9px] font-black uppercase tracking-widest" style={{ color: palette.textSecondary }}>
                      Max
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="mr-1 text-sm font-black" style={{ color: palette.textSecondary }}>{currency}</Text>
                      <TextInput
                        placeholder="99999"
                        placeholderTextColor={placeholderColor}
                        className="flex-1 py-1 text-base font-black"
                        style={{ color: palette.text }}
                        keyboardType="numeric"
                        value={draftMaxPrice}
                        onChangeText={setDraftMaxPrice}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <Button
              title={`Show Products${draftFilterCount ? ` (${draftFilterCount})` : ''}`}
              onPress={handleApplyFilters}
              className="mt-2 h-12 rounded-2xl"
            />
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <View className="flex-row flex-wrap p-2.5" style={{ backgroundColor: palette.background }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} className="w-[50%] p-1.5">
              <Skeleton width="100%" height={220} className="rounded-[22px]" />
            </View>
          ))}
        </View>
      ) : productsList.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8" style={{ backgroundColor: palette.background }}>
          <Text className="mb-2 text-lg font-black italic" style={{ color: palette.text }}>
            No Products Found
          </Text>
          <Text className="mb-6 text-center text-xs" style={{ color: palette.textSecondary }}>
            Try adjusting your search keywords or filter values.
          </Text>
          <Button title="Reset Filters" onPress={handleClearFilters} className="w-1/2" />
        </View>
      ) : (
        <FlatList
          overScrollMode="never"
          data={productsList}
          keyExtractor={keyExtractor}
          numColumns={2}
          contentContainerStyle={{ padding: 6, paddingBottom: 28 }}
          renderItem={renderProduct}
          refreshing={isRefetching}
          onRefresh={refetch}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
          onMomentumScrollBegin={() => {
            endReachedLockedRef.current = false;
          }}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color={theme === 'dark' ? palette.onPrimary : palette.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
