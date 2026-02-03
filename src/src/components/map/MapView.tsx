'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef, ViewStateChangeEvent, MarkerEvent } from 'react-map-gl/mapbox';
import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';
import { MapPin, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAP_DEFAULTS, getPinColor } from '@/lib/constants';
import { Spot } from '@/types/spot';
import { supabase } from '@/lib/supabase/client';
import SpotDetailSheet from '@/components/spot/SpotDetailSheet';
import SpotFormSheet from '@/components/spot/SpotFormSheet';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const LONG_PRESS_DURATION = 500; // ミリ秒

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
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
      console.error('Error fetching spots:', JSON.stringify(error, null, 2));
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
        console.error('Error fetching spots:', JSON.stringify(error, null, 2));
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

  // 初回起動時に位置情報が許可されていれば現在地に移動
  useEffect(() => {
    if (!navigator.geolocation) return;

    // 位置情報の許可状態を確認
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        // 既に許可されている場合は自動的に現在地を取得
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setViewState((prev) => ({
              ...prev,
              latitude,
              longitude,
              zoom: 16,
            }));
          },
          (error) => {
            console.error('Geolocation error:', error);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }).catch(() => {
      // permissions APIがサポートされていない場合は何もしない
    });
  }, []);

  // 現在地に移動
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert('お使いのブラウザでは位置情報が使用できません');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setViewState((prev) => ({
          ...prev,
          latitude,
          longitude,
          zoom: 16,
        }));
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('位置情報の取得に失敗しました。位置情報の許可を確認してください。');
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // ピンクリック
  const handleMarkerClick = (spot: Spot) => {
    setSelectedSpot(spot);
    setIsDetailOpen(true);
  };

  // マップ長押し（デスクトップ右クリック対応）
  const handleMapLongPress = useCallback((e: MapMouseEvent) => {
    setNewSpotLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    setEditingSpot(null); // 新規モード
    setIsFormOpen(true);
  }, []);

  // タッチ開始（モバイル長押し対応）
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // シングルタッチのみ
    
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimerRef.current = setTimeout(() => {
      // 長押し検出時、マップの座標を取得
      const map = mapRef.current?.getMap();
      if (map && touchStartPosRef.current) {
        const point = map.unproject([touchStartPosRef.current.x, touchStartPosRef.current.y]);
        setNewSpotLocation({ lat: point.lat, lng: point.lng });
        setEditingSpot(null);
        setIsFormOpen(true);
        // バイブレーションフィードバック（対応デバイスのみ）
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
      longPressTimerRef.current = null;
    }, LONG_PRESS_DURATION);
  }, []);

  // タッチ移動（移動したら長押しキャンセル）
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPosRef.current || !longPressTimerRef.current) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPosRef.current.x;
    const dy = touch.clientY - touchStartPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 10px以上動いたらキャンセル
    if (distance > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // タッチ終了
  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
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

  // 日本語ラベルを設定する関数
  const setJapaneseLabels = useCallback((map: MapboxMap) => {
    const style = map.getStyle();
    if (!style?.layers) return;

    style.layers.forEach((layer) => {
      if (layer.type === 'symbol' && layer.layout?.['text-field']) {
        map.setLayoutProperty(layer.id, 'text-field', [
          'coalesce',
          ['get', 'name_ja'],
          ['get', 'name'],
        ]);
      }
    });
  }, []);

  // 日本語化が実行されたかどうかのフラグ
  const japaneseLabelsAppliedRef = useRef(false);

  // Map ref のコールバック - マップインスタンスが利用可能になったら呼ばれる
  const handleMapRef = useCallback((ref: MapRef | null) => {
    if (!ref) return;
    
    // mapRef を更新
    (mapRef as React.MutableRefObject<MapRef | null>).current = ref;
    
    const map = ref.getMap();
    if (!map) return;

    // スタイル読み込み完了時のハンドラ
    const handleStyleLoad = () => {
      setJapaneseLabels(map);
      japaneseLabelsAppliedRef.current = true;
    };

    // マップ読み込み完了時のハンドラ  
    const handleLoad = () => {
      setJapaneseLabels(map);
      japaneseLabelsAppliedRef.current = true;
    };

    // idleイベント（マップが完全にレンダリング完了した時）
    const handleIdle = () => {
      if (!japaneseLabelsAppliedRef.current) {
        setJapaneseLabels(map);
        japaneseLabelsAppliedRef.current = true;
      }
    };

    // 既にスタイルが読み込まれている場合は即座に日本語化
    if (map.isStyleLoaded()) {
      setJapaneseLabels(map);
      japaneseLabelsAppliedRef.current = true;
    }

    // イベントリスナーを登録
    map.on('load', handleLoad);
    map.on('style.load', handleStyleLoad);
    map.on('idle', handleIdle);
  }, [setJapaneseLabels]);

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
    <div 
      className="relative h-full w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <Map
        ref={handleMapRef}
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onContextMenu={handleMapLongPress}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

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

      {/* 現在地ボタン - モバイルセーフエリア対応 */}
      <Button
        size="lg"
        className="absolute right-4 h-14 w-14 rounded-full shadow-lg"
        style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        onClick={handleGeolocate}
        title="現在地に移動"
      >
        <Locate size={24} />
      </Button>

      {/* ヘルプテキスト - モバイルセーフエリア対応 */}
      <div 
        className="absolute left-4 right-20 rounded-lg bg-white/90 px-3 py-2 text-xs text-zinc-600 shadow backdrop-blur-sm"
        style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        📍 右下のボタンで現在地へ移動 ／ 長押しで新規登録
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
