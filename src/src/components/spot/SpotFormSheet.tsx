'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, GripVertical } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  AUDIENCE_ATTRIBUTES,
  TIME_SLOTS,
  DEFAULT_BEST_TIME,
  DEFAULT_RATING,
  RATING_DESCRIPTIONS,
  CAR_ACCESSIBILITY_OPTIONS,
  CarAccessibility,
} from '@/lib/constants';
import { createSpot } from '@/app/actions/spot';

interface SpotFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocation: { lat: number; lng: number } | null;
  onSuccess: () => void;
}

interface ImagePreview {
  file: File;
  preview: string;
}

export default function SpotFormSheet({
  open,
  onOpenChange,
  initialLocation,
  onSuccess,
}: SpotFormSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // フォーム状態
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(DEFAULT_RATING);
  const [bestTime, setBestTime] = useState<number[]>(DEFAULT_BEST_TIME);
  const [audienceAttributes, setAudienceAttributes] = useState<string[]>([]);
  const [carAccessibility, setCarAccessibility] = useState<CarAccessibility | ''>('');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [passcode, setPasscode] = useState('');

  // 画像ドロップゾーン
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // 画像削除
  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // 画像の並び替え
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const newImages = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      return newImages;
    });
  };

  // 時間帯トグル
  const handleTimeToggle = (timeId: number) => {
    setBestTime((prev) =>
      prev.includes(timeId) ? prev.filter((id) => id !== timeId) : [...prev, timeId]
    );
  };

  // 聴衆属性トグル
  const handleAudienceToggle = (attr: string) => {
    setAudienceAttributes((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  // フォームリセット
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRating(DEFAULT_RATING);
    setBestTime(DEFAULT_BEST_TIME);
    setAudienceAttributes([]);
    setCarAccessibility('');
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setPasscode('');
    setError(null);
  };

  // 送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション（表示順に実行）
    if (!initialLocation) {
      setError('位置情報が取得できません');
      return;
    }

    if (!title.trim()) {
      setError('場所の名前を入力してください');
      return;
    }

    if (images.length === 0) {
      setError('写真を1枚以上追加してください');
      return;
    }

    if (!carAccessibility) {
      setError('選挙カーの利用可否を選択してください');
      return;
    }

    if (!passcode.trim()) {
      setError('共有パスコードを入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('rating', rating.toString());
      formData.append('lat', initialLocation.lat.toString());
      formData.append('lng', initialLocation.lng.toString());
      formData.append('bestTime', JSON.stringify(bestTime));
      formData.append('audienceAttributes', JSON.stringify(audienceAttributes));
      formData.append('carAccessibility', carAccessibility);
      formData.append('passcode', passcode);
      
      images.forEach((img, index) => {
        formData.append(`image_${index}`, img.file);
      });

      const result = await createSpot(formData);

      if (!result.success) {
        setError(result.error || '投稿に失敗しました');
        return;
      }

      resetForm();
      onSuccess();
    } catch (err) {
      console.error('Submit error:', err);
      setError('投稿中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingDescription = (value: number): string => {
    return RATING_DESCRIPTIONS[value.toString()] || '';
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader className="text-left">
          <SheetTitle>新しいスポットを登録</SheetTitle>
          <SheetDescription>
            演説に適した場所の情報を共有しましょう
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title">場所の名前 *</Label>
            <Input
              id="title"
              placeholder="例: 〇〇スーパー前"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* 写真アップロード */}
          <div className="space-y-2">
            <Label>写真 *</Label>
            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 mb-2">
              <p className="font-medium mb-1">📸 撮影のポイント</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>なるべく<strong>引きで撮影</strong>して、設営場所がわかるように</li>
                <li>演説中なら、演説者・選挙カー・背後の建物が入るように</li>
                <li>周辺環境（人通り、道路状況など）が伝わる構図が理想</li>
              </ul>
            </div>
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-zinc-300 hover:border-zinc-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-600">
                {isDragActive ? '画像をドロップ' : 'クリックまたはドラッグで画像を追加'}
              </p>
            </div>

            {/* 画像プレビュー */}
            {images.length > 0 && (
              <div className="space-y-2">
                {images.map((img, index) => (
                  <div
                    key={img.preview}
                    className="flex items-center gap-2 rounded-lg border bg-zinc-50 p-2"
                  >
                    <GripVertical className="h-4 w-4 text-zinc-400" />
                    <img
                      src={img.preview}
                      alt={`Preview ${index + 1}`}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <span className="flex-1 truncate text-sm">{img.file.name}</span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveImage(index, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveImage(index, 'down')}
                        disabled={index === images.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 推奨レベル */}
          <div className="space-y-3">
            <Label>演説効果スコア (Lv {rating})</Label>
            <Slider
              value={[rating]}
              onValueChange={([value]) => setRating(value)}
              min={1}
              max={10}
              step={1}
              className="py-2"
            />
            <p className="text-sm text-zinc-500">{getRatingDescription(rating)}</p>
          </div>

          {/* 聴衆属性 */}
          <div className="space-y-2">
            <Label>聴衆の属性</Label>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_ATTRIBUTES.map((attr) => (
                <Badge
                  key={attr}
                  variant={audienceAttributes.includes(attr) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleAudienceToggle(attr)}
                >
                  {attr}
                </Badge>
              ))}
            </div>
          </div>

          {/* 選挙カー利用可否 */}
          <div className="space-y-2">
            <Label>選挙カー *</Label>
            <div className="flex flex-wrap gap-2">
              {CAR_ACCESSIBILITY_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={carAccessibility === option.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setCarAccessibility(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* おすすめ時間帯 */}
          <div className="space-y-2">
            <Label>おすすめ時間帯</Label>
            <div className="flex flex-wrap gap-1">
              {TIME_SLOTS.map((slot) => (
                <Badge
                  key={slot.id}
                  variant={bestTime.includes(slot.id) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => handleTimeToggle(slot.id)}
                >
                  {slot.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description">補足情報</Label>
            <Textarea
              id="description"
              placeholder="例: 駐車場あり、許可不要、週末は人通り多め"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* 位置情報 */}
          {initialLocation && (
            <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500">
              位置: {initialLocation.lat.toFixed(6)}, {initialLocation.lng.toFixed(6)}
            </div>
          )}

          {/* パスコード */}
          <div className="space-y-2">
            <Label htmlFor="passcode">共有パスコード *</Label>
            <Input
              id="passcode"
              type="password"
              placeholder="チームで共有されたパスコード"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
            />
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 送信ボタン */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? '投稿中...' : 'このスポットを登録'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
