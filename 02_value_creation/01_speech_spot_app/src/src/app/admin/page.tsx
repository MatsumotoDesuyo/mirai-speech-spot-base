'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteSpot } from '@/app/actions/spot';

export default function AdminPage() {
  const [spotId, setSpotId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!spotId.trim() || !adminPassword.trim()) {
      setResult({ success: false, message: '全ての項目を入力してください' });
      return;
    }

    if (!confirm(`本当にスポット ${spotId} を削除しますか？`)) {
      return;
    }

    setIsDeleting(true);
    setResult(null);

    try {
      const response = await deleteSpot(spotId, adminPassword);
      
      if (response.success) {
        setResult({ success: true, message: 'スポットを削除しました' });
        setSpotId('');
      } else {
        setResult({ success: false, message: response.error || '削除に失敗しました' });
      }
    } catch {
      setResult({ success: false, message: '予期せぬエラーが発生しました' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-4">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              管理者ページ
            </CardTitle>
            <CardDescription>
              スポットの削除を行います
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDelete} className="space-y-4">
              {/* 結果表示 */}
              {result && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    result.success
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {result.message}
                </div>
              )}

              {/* Spot ID */}
              <div className="space-y-2">
                <Label htmlFor="spotId">Spot ID</Label>
                <Input
                  id="spotId"
                  placeholder="削除するスポットのUUID"
                  value={spotId}
                  onChange={(e) => setSpotId(e.target.value)}
                  required
                />
              </div>

              {/* 管理者パスワード */}
              <div className="space-y-2">
                <Label htmlFor="adminPassword">管理者パスワード</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="管理者パスワードを入力"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>

              {/* 削除ボタン */}
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={isDeleting}
              >
                {isDeleting ? '削除中...' : 'スポットを削除'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-zinc-400">
          ※ この操作は取り消せません
        </p>
      </div>
    </div>
  );
}
