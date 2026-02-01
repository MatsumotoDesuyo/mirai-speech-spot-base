'use client';

import dynamic from 'next/dynamic';

// Mapboxはクライアントサイドのみで動作するため、dynamic importを使用
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-100">
      <div className="text-lg text-zinc-500">マップを読み込み中...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="relative h-screen w-full">
      <MapView />
    </main>
  );
}
