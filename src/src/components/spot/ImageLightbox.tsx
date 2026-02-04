'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImageLightbox({
  images,
  initialIndex,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // タッチ操作用
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const swipeStartXRef = useRef<number | null>(null);

  // 2点間の距離を計算
  const getDistance = useCallback((x1: number, y1: number, x2: number, y2: number): number => {
    return Math.hypot(x2 - x1, y2 - y1);
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (scale > 1) return; // ズーム中は無効
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length, scale]);

  const handleNext = useCallback(() => {
    if (scale > 1) return; // ズーム中は無効
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length, scale]);

  // ダブルタップ検出
  const handleDoubleTap = useCallback((x: number, y: number) => {
    if (scale > 1) {
      // ズーム中は元に戻す
      resetZoom();
    } else {
      // ズームイン（2倍）
      setScale(2);
      // タップ位置を中心にズーム
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (centerX - x) * 1; // scale - 1
        const offsetY = (centerY - y) * 1;
        setPosition({ x: offsetX, y: offsetY });
      }
    }
  }, [scale, resetZoom]);

  // 初期化 - openがtrueになったときにリセット
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // 閉じた状態から開いた時のみ初期化
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
    prevOpenRef.current = open;
  }, [open, initialIndex]);

  // 画像切り替え時にズームをリセット
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (currentIndex !== prevIndexRef.current) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === 'Escape') {
        onOpenChange(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, handlePrev, handleNext]);

  // スクロール無効化
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // タッチ開始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // ピンチ開始
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialPinchDistanceRef.current = getDistance(t1.clientX, t1.clientY, t2.clientX, t2.clientY);
      initialScaleRef.current = scale;
      swipeStartXRef.current = null;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      
      // ダブルタップ検出
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        handleDoubleTap(touch.clientX, touch.clientY);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }

      // スワイプ開始位置を記録（ズーム中でない場合のみ）
      if (scale === 1) {
        swipeStartXRef.current = touch.clientX;
      }

      // ズーム中のドラッグ開始
      if (scale > 1) {
        setIsDragging(true);
      }
    }
  }, [scale, handleDoubleTap, getDistance]);

  // タッチ移動
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
      // ピンチズーム
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = getDistance(t1.clientX, t1.clientY, t2.clientX, t2.clientY);
      const scaleChange = currentDistance / initialPinchDistanceRef.current;
      const newScale = Math.min(Math.max(initialScaleRef.current * scaleChange, 1), 4);
      setScale(newScale);
      
      // ズームアウトで1になったら位置もリセット
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      
      if (scale > 1 && isDragging) {
        // ズーム中のパン（ドラッグ）
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        
        setPosition((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, [scale, isDragging, getDistance]);

  // タッチ終了
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // スワイプ検出（ズーム中でない場合のみ）
    if (scale === 1 && swipeStartXRef.current !== null && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeStartXRef.current;
      const threshold = 50;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    }

    initialPinchDistanceRef.current = null;
    touchStartRef.current = null;
    swipeStartXRef.current = null;
    setIsDragging(false);
  }, [scale, handlePrev, handleNext]);

  // オーバーレイクリックで閉じる
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      onOpenChange(false);
    }
  }, [onOpenChange]);

  if (!open) return null;

  const hasMultipleImages = images.length > 1;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      {/* 閉じるボタン */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        onClick={() => onOpenChange(false)}
      >
        <X size={24} />
      </Button>

      {/* 前へボタン */}
      {hasMultipleImages && scale === 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
          onClick={handlePrev}
        >
          <ChevronLeft size={32} />
        </Button>
      )}

      {/* 画像コンテナ */}
      <div
        ref={imageRef}
        className="relative w-full h-full flex items-center justify-center touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative w-full h-full transition-transform duration-100"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            willChange: 'transform',
          }}
        >
          <Image
            src={images[currentIndex]}
            alt={`画像 ${currentIndex + 1}`}
            fill
            className="object-contain pointer-events-none select-none"
            priority
            sizes="100vw"
            draggable={false}
          />
        </div>
      </div>

      {/* 次へボタン */}
      {hasMultipleImages && scale === 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
          onClick={handleNext}
        >
          <ChevronRight size={32} />
        </Button>
      )}

      {/* インジケーター */}
      {hasMultipleImages && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
          <div className="rounded-full bg-black/60 px-4 py-2 text-sm text-white">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}

      {/* ズームヒント（初回表示時） */}
      {scale === 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 text-white/60 text-xs">
          ダブルタップまたはピンチで拡大
        </div>
      )}
    </div>
  );
}
