'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef, ViewStateChangeEvent, MarkerEvent } from 'react-map-gl/mapbox';
import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';
import { MapPin, Locate, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAP_DEFAULTS, getPinColor } from '@/lib/constants';
import { Spot } from '@/types/spot';
import { supabase } from '@/lib/supabase/client';
import SpotDetailSheet from '@/components/spot/SpotDetailSheet';
import SpotFormSheet from '@/components/spot/SpotFormSheet';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const LONG_PRESS_DURATION = 500; // ミリ秒
const FLY_TO_DURATION = 1500; // flyToアニメーションの時間（ミリ秒）

interface MapViewProps {
  initialSpotId?: string | null;
}

export default function MapView({ initialSpotId }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasInitializedLocationRef = useRef(false); // 位置情報初期化済みフラグ
  const pendingFlyToRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null); // マップ読み込み後に移動する座標
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [newSpotLocation, setNewSpotLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewState, setViewState] = useState({
    longitude: MAP_DEFAULTS.lng,
    latitude: MAP_DEFAULTS.lat,
    zoom: MAP_DEFAULTS.zoom,
  });

  // 位置調整モード
  const [isAdjustingPosition, setIsAdjustingPosition] = useState(false);
  const [positionAdjustOrigin, setPositionAdjustOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [adjustedLocationForForm, setAdjustedLocationForForm] = useState<{ lat: number; lng: number } | null>(null);
  const viewStateRef = useRef(viewState);

  // viewStateRefを最新に保つ
  useEffect(() => {
    viewStateRef.current = viewState;
  }, [viewState]);

  // URLのspotパラメータを更新（ページリロードなし）
  const updateUrlSpotParam = useCallback((spotId: string | null) => {
    const url = new URL(window.location.href);
    if (spotId) {
      url.searchParams.set('spot', spotId);
    } else {
      url.searchParams.delete('spot');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

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
        
        // initialSpotIdがある場合、該当スポットを自動選択
        if (initialSpotId && data) {
          const targetSpot = data.find((s) => s.id === initialSpotId);
          if (targetSpot) {
            setSelectedSpot(targetSpot);
            setIsDetailOpen(true);
            // マップが読み込まれた後にアニメーションで移動するため、座標を保持
            const flyToTarget = { lat: targetSpot.lat, lng: targetSpot.lng, zoom: 16 };
            pendingFlyToRef.current = flyToTarget;
            
            // マップが既に読み込まれている場合は即座にflyTo
            const map = mapRef.current?.getMap();
            if (map && map.isStyleLoaded()) {
              map.flyTo({
                center: [flyToTarget.lng, flyToTarget.lat],
                zoom: flyToTarget.zoom,
                duration: FLY_TO_DURATION,
              });
              pendingFlyToRef.current = null;
            }
          }
        }
      }
    };
    
    loadSpots();
    
    return () => {
      isMounted = false;
    };
  }, [initialSpotId]);

  // 初回起動時に位置情報が許可されていれば現在地に移動
  // ただし、initialSpotIdが指定されている場合はスキップ（スポット位置を優先）
  // 一度初期化したら再実行しない（スポット詳細を閉じた時の再トリガー防止）
  useEffect(() => {
    // 既に初期化済みならスキップ
    if (hasInitializedLocationRef.current) return;
    
    if (!navigator.geolocation) {
      hasInitializedLocationRef.current = true;
      return;
    }
    
    // スポットURLの場合は位置情報移動をスキップし、初期化済みとマーク
    if (initialSpotId) {
      hasInitializedLocationRef.current = true;
      return;
    }

    // 位置情報の許可状態を確認
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted' && !hasInitializedLocationRef.current) {
        hasInitializedLocationRef.current = true;
        // 既に許可されている場合は自動的に現在地を取得
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
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
      } else {
        hasInitializedLocationRef.current = true;
      }
    }).catch(() => {
      // permissions APIがサポートされていない場合は何もしない
      hasInitializedLocationRef.current = true;
    });
  }, [initialSpotId]);

  // 現在地に移動
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert('お使いのブラウザでは位置情報が使用できません');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
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
    updateUrlSpotParam(spot.id);
  };

  // マップ長押し（デスクトップ右クリック対応）
  const handleMapLongPress = useCallback((e: MapMouseEvent) => {
    if (isAdjustingPosition) return;
    setNewSpotLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    setEditingSpot(null); // 新規モード
    setAdjustedLocationForForm(null);
    setIsFormOpen(true);
  }, [isAdjustingPosition]);

  // タッチ開始（モバイル長押し対応）
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAdjustingPosition) return;
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
        setAdjustedLocationForForm(null);
        setIsFormOpen(true);
        // バイブレーションフィードバック（対応デバイスのみ）
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
      longPressTimerRef.current = null;
    }, LONG_PRESS_DURATION);
  }, [isAdjustingPosition]);

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
    setAdjustedLocationForForm(null);
    setIsFormOpen(true);
  };

  // 位置調整モード開始（SpotFormSheetからのコールバック）
  const handleRequestPositionAdjust = useCallback((currentLocation: { lat: number; lng: number }) => {
    setPositionAdjustOrigin(currentLocation);
    setIsAdjustingPosition(true);
    setIsFormOpen(false);

    const map = mapRef.current?.getMap();
    if (map) {
      map.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: Math.max(viewStateRef.current.zoom, 16),
        duration: FLY_TO_DURATION,
      });
    }
  }, []);

  // 位置調整確定
  const handlePositionAdjustConfirm = () => {
    const vs = viewStateRef.current;
    const newLocation = { lat: vs.latitude, lng: vs.longitude };
    setAdjustedLocationForForm(newLocation);
    setIsAdjustingPosition(false);
    setPositionAdjustOrigin(null);
    setIsFormOpen(true);

    const map = mapRef.current?.getMap();
    if (map) {
      map.flyTo({
        center: [newLocation.lng, newLocation.lat],
        duration: 500,
      });
    }
  };

  // 位置調整キャンセル
  const handlePositionAdjustCancel = () => {
    const origin = positionAdjustOrigin;
    setIsAdjustingPosition(false);
    setPositionAdjustOrigin(null);
    setIsFormOpen(true);

    if (origin) {
      const map = mapRef.current?.getMap();
      if (map) {
        map.flyTo({
          center: [origin.lng, origin.lat],
          duration: FLY_TO_DURATION,
        });
      }
    }
  };

  // 投稿・編集完了後
  const handleSpotCreated = () => {
    setIsFormOpen(false);
    setNewSpotLocation(null);
    setEditingSpot(null);
    setAdjustedLocationForForm(null);
    fetchSpots();
  };

  // 詳細シート閉じた後のリフレッシュ
  const handleDetailClose = () => {
    setIsDetailOpen(false);
    setSelectedSpot(null);
    updateUrlSpotParam(null);
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
      
      // 保留中のflyToがあれば実行
      if (pendingFlyToRef.current) {
        const target = pendingFlyToRef.current;
        map.flyTo({
          center: [target.lng, target.lat],
          zoom: target.zoom,
          duration: FLY_TO_DURATION,
        });
        pendingFlyToRef.current = null;
      }
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
      
      // 保留中のflyToがあれば実行
      if (pendingFlyToRef.current) {
        const target = pendingFlyToRef.current;
        map.flyTo({
          center: [target.lng, target.lat],
          zoom: target.zoom,
          duration: FLY_TO_DURATION,
        });
        pendingFlyToRef.current = null;
      }
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
        {!isAdjustingPosition && <NavigationControl position="top-right" />}

        {/* スポットマーカー */}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            longitude={spot.lng}
            latitude={spot.lat}
            anchor="bottom"
            onClick={(e: MarkerEvent<Marker, MouseEvent>) => {
              if (isAdjustingPosition) return;
              e.originalEvent.stopPropagation();
              handleMarkerClick(spot);
            }}
          >
            <div 
              className={`cursor-pointer transition-transform hover:scale-110 ${isAdjustingPosition ? 'opacity-30' : ''}`}
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

        {/* 現在地マーカー */}
        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="center"
          >
            <div className="relative flex items-center justify-center">
              {/* 外側の波紋エフェクト */}
              <div className="absolute h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-40" />
              {/* 精度を示す外側の円 */}
              <div className="absolute h-6 w-6 rounded-full bg-blue-500/30" />
              {/* 中央の青い丸 */}
              <div className="relative h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
            </div>
          </Marker>
        )}
      </Map>

      {/* 位置調整モード UI */}
      {isAdjustingPosition && (
        <>
          {/* 中央固定ピン */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full">
            <MapPin size={40} fill="#ef4444" color="#fff" strokeWidth={1.5} />
          </div>

          {/* キャンセルボタン */}
          <Button
            variant="outline"
            className="absolute left-4 top-4 z-20 rounded-full border bg-white/90 shadow-lg backdrop-blur-sm"
            onClick={handlePositionAdjustCancel}
          >
            <X size={16} className="mr-1" /> やめる
          </Button>

          {/* 決定ボタン */}
          <Button
            className="absolute right-4 top-4 z-20 rounded-full shadow-lg"
            onClick={handlePositionAdjustConfirm}
          >
            <Check size={16} className="mr-1" /> この位置に決定
          </Button>

          {/* 座標表示 */}
          <div
            className="absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[10px] text-white backdrop-blur-sm"
            style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
          >
            {viewState.latitude.toFixed(6)}, {viewState.longitude.toFixed(6)}
          </div>
        </>
      )}

      {/* 現在地ボタン - モバイルセーフエリア対応 */}
      {!isAdjustingPosition && (
        <Button
          size="lg"
          className="absolute right-4 h-14 w-14 rounded-full shadow-lg"
          style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
          onClick={handleGeolocate}
          title="現在地に移動"
        >
          <Locate size={24} />
        </Button>
      )}

      {/* ヘルプテキスト - モバイルセーフエリア対応 */}
      {!isAdjustingPosition && (
        <div 
          className="absolute left-4 right-20 rounded-lg bg-white/90 px-3 py-2 text-xs text-zinc-600 shadow backdrop-blur-sm"
          style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        >
          📍 右下のボタンで現在地へ移動 ／ 長押しで新規登録
        </div>
      )}

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
            setAdjustedLocationForForm(null);
          }
        }}
        initialLocation={newSpotLocation}
        onSuccess={handleSpotCreated}
        editSpot={editingSpot}
        adjustedLocation={adjustedLocationForForm}
        onRequestPositionAdjust={handleRequestPositionAdjust}
      />
    </div>
  );
}
