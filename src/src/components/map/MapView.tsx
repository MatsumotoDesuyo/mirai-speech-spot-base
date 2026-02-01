'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import type { MapRef, ViewStateChangeEvent, MarkerEvent } from 'react-map-gl/mapbox';
import type { MapMouseEvent } from 'mapbox-gl';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAP_DEFAULTS, getPinColor } from '@/lib/constants';
import { Spot } from '@/types/spot';
import { supabase } from '@/lib/supabase/client';
import SpotDetailSheet from '@/components/spot/SpotDetailSheet';
import SpotFormSheet from '@/components/spot/SpotFormSheet';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [newSpotLocation, setNewSpotLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewState, setViewState] = useState({
    longitude: MAP_DEFAULTS.lng,
    latitude: MAP_DEFAULTS.lat,
    zoom: MAP_DEFAULTS.zoom,
  });

  // スポット一覧を取得
  const fetchSpots = useCallback(async () => {
    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching spots:', error);
      return;
    }

    setSpots(data || []);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadSpots = async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching spots:', error);
        return;
      }

      if (isMounted) {
        setSpots(data || []);
      }
    };
    
    loadSpots();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // ピンクリック
  const handleMarkerClick = (spot: Spot) => {
    setSelectedSpot(spot);
    setIsDetailOpen(true);
  };

  // 新規投稿ボタン
  const handleAddClick = () => {
    // 現在のマップ中心を取得
    const center = mapRef.current?.getCenter();
    if (center) {
      setNewSpotLocation({ lat: center.lat, lng: center.lng });
    } else {
      setNewSpotLocation({ lat: viewState.latitude, lng: viewState.longitude });
    }
    setEditingSpot(null); // 新規モード
    setIsFormOpen(true);
  };

  // マップ長押し（モバイル対応）
  const handleMapLongPress = useCallback((e: MapMouseEvent) => {
    setNewSpotLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    setEditingSpot(null); // 新規モード
    setIsFormOpen(true);
  }, []);

  // 編集ボタンクリック
  const handleEditSpot = (spot: Spot) => {
    setIsDetailOpen(false);
    setSelectedSpot(null);
    setEditingSpot(spot);
    setNewSpotLocation(null);
    setIsFormOpen(true);
  };

  // 投稿・編集完了後
  const handleSpotCreated = () => {
    setIsFormOpen(false);
    setNewSpotLocation(null);
    setEditingSpot(null);
    fetchSpots();
  };

  // 詳細シート閉じた後のリフレッシュ
  const handleDetailClose = () => {
    setIsDetailOpen(false);
    setSelectedSpot(null);
    fetchSpots();
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-100">
        <div className="text-center">
          <p className="text-lg text-red-500">Mapboxトークンが設定されていません</p>
          <p className="mt-2 text-sm text-zinc-500">
            .env.local に NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN を設定してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onContextMenu={handleMapLongPress}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showUserHeading
          positionOptions={{ enableHighAccuracy: true }}
        />

        {/* スポットマーカー */}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            longitude={spot.lng}
            latitude={spot.lat}
            anchor="bottom"
            onClick={(e: MarkerEvent<Marker, MouseEvent>) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(spot);
            }}
          >
            <div 
              className="cursor-pointer transition-transform hover:scale-110"
              title={spot.title}
            >
              <MapPin
                size={32}
                fill={getPinColor(spot.rating)}
                color="#fff"
                strokeWidth={1.5}
              />
            </div>
          </Marker>
        ))}
      </Map>

      {/* 新規投稿ボタン */}
      <Button
        size="lg"
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={handleAddClick}
        title="新しいスポットを追加"
      >
        <Plus size={24} />
      </Button>

      {/* ヘルプテキスト */}
      <div className="absolute bottom-6 left-4 right-20 rounded-lg bg-white/90 px-3 py-2 text-xs text-zinc-600 shadow backdrop-blur-sm">
        💡 右下の＋ボタンか、マップ上で右クリック（モバイルは長押し）で新規登録
      </div>

      {/* スポット詳細シート */}
      <SpotDetailSheet
        spot={selectedSpot}
        open={isDetailOpen}
        onOpenChange={handleDetailClose}
        onEdit={handleEditSpot}
      />

      {/* スポット投稿フォーム */}
      <SpotFormSheet
        open={isFormOpen}
        onOpenChange={(open: boolean) => {
          setIsFormOpen(open);
          if (!open) {
            setNewSpotLocation(null);
            setEditingSpot(null);
          }
        }}
        initialLocation={newSpotLocation}
        onSuccess={handleSpotCreated}
        editSpot={editingSpot}
      />
    </div>
  );
}
