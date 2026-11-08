"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import { getImageUrl } from "@/utils/imageUtils";

// Swiper Styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

const emptySubscribe = () => () => {};

export default function BannerSlider({ slides = [], buttonText = "Shop Now", lang = "en", showHeader = false }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!slides || slides.length === 0) return null;

  const firstSlide = slides[0];

  // Hydration fallback matches the actual Swiper DOM structure and exact image parameters
  if (!mounted) {
    return (
      <section className="relative w-full overflow-hidden group/slider" aria-label="Main Banner Slider Placeholder">
        <div className="w-full bg-black overflow-hidden flex justify-center items-center">
          {firstSlide && (
            firstSlide.link ? (
              <Link href={firstSlide.link} className="block w-full">
                <Image
                  src={getImageUrl(firstSlide.image, 1920, 100)}
                  alt={firstSlide.title || "Banner Image"}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: "100%", height: "auto" }}
                  priority
                  quality={100}
                  className="w-full h-auto"
                />
              </Link>
            ) : (
              <Image
                src={getImageUrl(firstSlide.image, 1920, 100)}
                alt={firstSlide.title || "Banner Image"}
                width={0}
                height={0}
                sizes="100vw"
                style={{ width: "100%", height: "auto" }}
                priority
                quality={100}
                className="w-full h-auto"
              />
            )
          )}
        </div>
      </section>
    );
  }


  return (
    <section className="relative w-full overflow-hidden group/slider" aria-label="Main Banner Slider">
      <Swiper
        key={slides.length}
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={1000}
        autoHeight={true} // Crucial for variable image heights
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
          pauseOnMouseEnter: false
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
          el: '.custom-pagination',
        }}
        navigation={{
          nextEl: '.slider-next',
          prevEl: '.slider-prev',
        }}
        loop={slides.length > 1}
        grabCursor={true}
        touchStartPreventDefault={false}
        touchReleaseOnEdges={true}
        className="banner-swiper w-full"
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={idx}>
            <div className="w-full bg-black overflow-hidden flex justify-center items-center">
              {slide.link ? (
                <Link href={slide.link} className="block w-full">
                  <Image
                    src={getImageUrl(slide.image, 1920, 100)}
                    alt={slide.title || "Banner Image"}
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: "100%", height: "auto" }}
                    priority={idx === 0}
                    quality={100}
                    className="transition-transform duration-[10s] ease-out group-hover/slider:scale-105"
                  />
                </Link>
              ) : (
                <Image
                  src={getImageUrl(slide.image, 1920, 100)}
                  alt={slide.title || "Banner Image"}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: "100%", height: "auto" }}
                  priority={idx === 0}
                  quality={100}
                  className="transition-transform duration-[10s] ease-out group-hover/slider:scale-105"
                />
              )}
            </div>
          </SwiperSlide>
        ))}

        {/* Custom Navigation & Pagination UI */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <div className="custom-pagination flex gap-2" />
          </div>
        )}
      </Swiper>

      <style jsx global>{`
        .banner-swiper .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.3;
          width: 8px !important;
          height: 8px !important;
          transition: all 0.5s ease;
        }
        .banner-swiper .swiper-pagination-bullet-active {
          background: #fff !important;
          opacity: 1;
          width: 40px !important;
          border-radius: 4px !important;
        }
      `}</style>
    </section>
  );
}