'use client';

import { useState, useCallback } from 'react';
import { Key, Plus, Power, PowerOff, Copy, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createApiKey, listApiKeys, toggleApiKey } from '@/app/actions/api-keys';
import type { ApiKeyWithUsage } from '@/types/spot';

export default function ApiKeysPage() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appName, setAppName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keys, setKeys] = useState<ApiKeyWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(async (code: string) => {
    setIsLoading(true);
    const result = await listApiKeys(code);
    if (result.success && result.data) {
      setKeys(result.data);
    } else {
      setError(result.error || 'キー一覧の取得に失敗しました');
    }
    setIsLoading(false);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await listApiKeys(passcode);
    if (result.success) {
      setIsAuthenticated(true);
      setKeys(result.data || []);
    } else {
      setError(result.error || '認証に失敗しました');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);
    setNewApiKey(null);

    const result = await createApiKey(appName, passcode);
    if (result.success && result.data) {
      setNewApiKey(result.data.api_key);
      setAppName('');
      await loadKeys(passcode);
    } else {
      setError(result.error || 'APIキーの作成に失敗しました');
    }
    setIsCreating(false);
  };

  const handleToggle = async (keyId: string, currentActive: boolean) => {
    const action = currentActive ? '無効化' : '有効化';
    if (!confirm(`このAPIキーを${action}しますか？`)) return;

    setError(null);
    const result = await toggleApiKey(keyId, !currentActive, passcode);
    if (result.success) {
      await loadKeys(passcode);
    } else {
      setError(result.error || '更新に失敗しました');
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 認証画面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-100 p-4">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                API管理 - 認証
              </CardTitle>
              <CardDescription>API管理パスコードを入力してください</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="passcode">パスコード</Label>
                  <Input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="API管理パスコード"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  ログイン
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 管理画面
  return (
    <div className="min-h-screen bg-zinc-100 p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* エラー表示 */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* 新しいAPIキー表示（発行直後） */}
        {newApiKey && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 text-base">APIキーが発行されました</CardTitle>
              <CardDescription className="text-green-700">
                このキーは今回のみ表示されます。必ずコピーして安全に保管してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono break-all border">
                  {newApiKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(newApiKey)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-4 rounded bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <p className="font-semibold mb-1">利用規約（AGPL-3.0）</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>データの出典として「演説スポットBase」のクレジット表示が必要です。</li>
                  <li>AGPL-3.0ライセンスに準拠してください。</li>
                  <li>データの再配布時もライセンス条件を維持してください。</li>
                  <li>画像データは可能な限り自身のストレージにコピーして利用してください。</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* APIキー発行フォーム */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              APIキー発行
            </CardTitle>
            <CardDescription>外部アプリ用のAPIキーを発行します</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="appName">アプリ名</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="例: 演説ナビアプリ"
                  required
                />
              </div>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? '発行中...' : '発行'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* APIキー一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              発行済みAPIキー
            </CardTitle>
            <CardDescription>
              全 {keys.length} 件 ・ 各キー 1日最大10回アクセス可能
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-zinc-500">読み込み中...</p>
            ) : keys.length === 0 ? (
              <p className="text-sm text-zinc-500">APIキーはまだ発行されていません。</p>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      key.is_active ? 'bg-white' : 'bg-zinc-50 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{key.app_name}</span>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? '有効' : '無効'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <code>{key.api_key_prefix}...</code>
                        <span>本日: {key.today_access_count}/10回</span>
                        <span>作成: {new Date(key.created_at).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(key.id, key.is_active)}
                      title={key.is_active ? '無効化' : '有効化'}
                    >
                      {key.is_active ? (
                        <PowerOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Power className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
