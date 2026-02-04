'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Mapboxはクライアントサイドのみで動作するため、dynamic importを使用
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen-safe w-full items-center justify-center bg-zinc-100">
      <div className="text-lg text-zinc-500">マップを読み込み中...</div>
    </div>
  ),
});

function MapWithParams() {
  const searchParams = useSearchParams();
  const initialSpotId = searchParams.get('spot');

  return <MapView initialSpotId={initialSpotId} />;
}

export default function Home() {
  return (
    <main className="fixed inset-0 h-screen-safe w-full">
      <Suspense fallback={
        <div className="flex h-screen-safe w-full items-center justify-center bg-zinc-100">
          <div className="text-lg text-zinc-500">マップを読み込み中...</div>
        </div>
      }>
        <MapWithParams />
      </Suspense>
    </main>
  );
}
