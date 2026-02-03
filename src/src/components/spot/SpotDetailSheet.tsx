'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Clock, Users, ChevronLeft, ChevronRight, Car, Edit, MapPin, ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spot } from '@/types/spot';
import { TIME_SLOTS, RATING_DESCRIPTIONS, CAR_ACCESSIBILITY_OPTIONS } from '@/lib/constants';

interface SpotDetailSheetProps {
  spot: Spot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (spot: Spot) => void;
}

export default function SpotDetailSheet({ spot, open, onOpenChange, onEdit }: SpotDetailSheetProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const images = spot?.images || [];
  const hasMultipleImages = images.length > 1;

  // Reset image index when spot changes
  useEffect(() => {
    setCurrentImageIndex(0);
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }
  }, [spot?.id]);

  // Preload adjacent images
  useEffect(() => {
    if (images.length <= 1) return;
    
    const preloadIndices = [
      (currentImageIndex - 1 + images.length) % images.length,
      (currentImageIndex + 1) % images.length,
    ];
    
    preloadIndices.forEach((index) => {
      const img = new window.Image();
      img.src = images[index];
    });
  }, [currentImageIndex, images]);

  const handlePrevImage = useCallback(() => {
    const newIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
    if (carouselRef.current) {
      const scrollWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({ left: newIndex * scrollWidth, behavior: 'smooth' });
    }
  }, [currentImageIndex, images.length]);

  const handleNextImage = useCallback(() => {
    const newIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
    if (carouselRef.current) {
      const scrollWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({ left: newIndex * scrollWidth, behavior: 'smooth' });
    }
  }, [currentImageIndex, images.length]);

  // Handle scroll events to update current index
  const handleScroll = useCallback(() => {
    if (!carouselRef.current || isScrolling) return;
    
    const scrollLeft = carouselRef.current.scrollLeft;
    const scrollWidth = carouselRef.current.clientWidth;
    const newIndex = Math.round(scrollLeft / scrollWidth);
    
    if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < images.length) {
      setCurrentImageIndex(newIndex);
    }
  }, [currentImageIndex, images.length, isScrolling]);

  // Snap to nearest image after scroll ends
  const handleScrollEnd = useCallback(() => {
    if (!carouselRef.current) return;
    
    const scrollLeft = carouselRef.current.scrollLeft;
    const scrollWidth = carouselRef.current.clientWidth;
    const newIndex = Math.round(scrollLeft / scrollWidth);
    
    setCurrentImageIndex(newIndex);
    setIsScrolling(false);
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let scrollTimeout: NodeJS.Timeout;
    
    const onScroll = () => {
      setIsScrolling(true);
      handleScroll();
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    };

    carousel.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      carousel.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleScroll, handleScrollEnd]);

  if (!spot) return null;

  const getRatingLabel = (rating: number): string => {
    return RATING_DESCRIPTIONS[rating.toString()] || `Lv ${rating}`;
  };

  const getBestTimeLabels = (bestTime: number[] | null): string[] => {
    if (!bestTime || bestTime.length === 0) return [];
    return bestTime
      .map((id) => TIME_SLOTS.find((slot) => slot.id === id)?.label)
      .filter((label): label is NonNullable<typeof label> => !!label) as string[];
  };

  const getCarAccessibilityLabel = (value: string): string => {
    const option = CAR_ACCESSIBILITY_OPTIONS.find((opt) => opt.value === value);
    return option?.label || value;
  };

  const getRatingBadgeColor = (rating: number): string => {
    if (rating >= 8) return 'bg-red-500 hover:bg-red-600';
    if (rating >= 5) return 'bg-blue-500 hover:bg-blue-600';
    return 'bg-zinc-400 hover:bg-zinc-500';
  };

  // Google Street Viewのリンクを生成
  const getGoogleStreetViewUrl = (lat: number, lng: number): string => {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  };

  // Google Mapsのリンクを生成
  const getGoogleMapsUrl = (lat: number, lng: number): string => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] overflow-y-auto rounded-t-xl">
        <SheetHeader className="text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{spot.title}</SheetTitle>
            <Badge className={`${getRatingBadgeColor(spot.rating)} text-white`}>
              Lv {spot.rating}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">{getRatingLabel(spot.rating)}</p>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* 選挙カー */}
          <div className="flex items-center gap-2">
            <Car size={16} className="text-zinc-500" />
            <span className="text-sm text-zinc-600">選挙カー:</span>
            <Badge variant="outline">
              {getCarAccessibilityLabel(spot.car_accessibility)}
            </Badge>
          </div>

          {/* 聴衆属性 */}
          {spot.audience_attributes && spot.audience_attributes.length > 0 && (
            <div className="flex items-center gap-2">
              <Users size={16} className="text-zinc-500" />
              <div className="flex flex-wrap gap-1">
                {spot.audience_attributes.map((attr) => (
                  <Badge key={attr} variant="outline">
                    {attr}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* おすすめ時間帯 */}
          {spot.best_time && spot.best_time.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-zinc-500" />
              <div className="flex flex-wrap gap-1">
                {getBestTimeLabels(spot.best_time).map((time) => (
                  <Badge key={time} variant="secondary">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 説明 */}
          {spot.description && (
            <div className="rounded-lg bg-zinc-50 p-3">
              <p className="whitespace-pre-wrap text-sm text-zinc-700">{spot.description}</p>
            </div>
          )}

          {/* 画像カルーセル */}
          {images.length > 0 && (
            <div className="relative w-full overflow-hidden rounded-lg bg-zinc-900">
              {/* スクロール可能なカルーセルコンテナ */}
              <div
                ref={carouselRef}
                className="flex aspect-video w-full snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {images.map((imageUrl, index) => (
                  <div
                    key={imageUrl}
                    className="relative aspect-video w-full flex-shrink-0 snap-center"
                  >
                    <Image
                      src={imageUrl}
                      alt={`${spot.title} - 画像 ${index + 1}`}
                      fill
                      className="object-contain"
                      priority={index === 0 || index === currentImageIndex}
                    />
                  </div>
                ))}
              </div>
              
              {hasMultipleImages && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={handleNextImage}
                  >
                    <ChevronRight size={20} />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 外部リンク */}
          <div className="flex gap-2">
            <a
              href={getGoogleStreetViewUrl(spot.lat, spot.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" className="w-full text-sm">
                <MapPin size={14} className="mr-1.5" />
                Street View
                <ExternalLink size={12} className="ml-1" />
              </Button>
            </a>
            <a
              href={getGoogleMapsUrl(spot.lat, spot.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" className="w-full text-sm">
                <MapPin size={14} className="mr-1.5" />
                Google Maps
                <ExternalLink size={12} className="ml-1" />
              </Button>
            </a>
          </div>

          {/* メタ情報 */}
          <div className="border-t pt-4 text-xs text-zinc-400 space-y-1">
            <p>ID: <span className="font-mono select-all">{spot.id}</span></p>
            <p>登録日: {new Date(spot.created_at).toLocaleDateString('ja-JP')}</p>
            <p>座標: {spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}</p>
          </div>

          {/* 編集ボタン */}
          {onEdit && (
            <div className="border-t pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onEdit(spot)}
              >
                <Edit size={16} className="mr-2" />
                編集する
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
