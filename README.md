# xbot セットアップメモ

## X (Twitter) OAuth 2.0 リフレッシュトークンの取得と登録

### リフレッシュトークンの有効期限
- **6ヶ月**（180日）
- ただし、使うたびにローテーション（新しいトークンに自動更新）されるので、定期的に動いている限りは期限切れにならない
- 6ヶ月以上まったく使わない場合は再取得が必要

---

### Step 1: X Developer Portal の設定確認

1. https://developer.x.com/en/portal/projects-and-apps を開く
2. 対象アプリの「Edit」→「User authentication settings」を確認
3. 以下が設定されていること：
   - **OAuth 2.0** が有効
   - **Scopes**: `tweet.read`, `tweet.write`, `users.read`, `offline.access`（`offline.access` がないとリフレッシュトークンが発行されない）
   - **Callback URL**: `https://oauth.pstmn.io/v1/callback`（Postman用）

---

### Step 2: Postman で認可コードを取得

1. Postman を開いて新規リクエストを作成
2. 「Authorization」タブ → Type: **OAuth 2.0**
3. 以下を入力：

| 項目 | 値 |
|---|---|
| Grant Type | Authorization Code (with PKCE) |
| Callback URL | `https://oauth.pstmn.io/v1/callback` |
| Auth URL | `https://x.com/i/oauth2/authorize` |
| Access Token URL | `https://api.x.com/2/oauth2/token` |
| Client ID | `.env` の `X_CLIENT_ID` の値 |
| Client Secret | `.env` の `X_API_APP_SECRET` の値 |
| Scope | `tweet.read tweet.write users.read offline.access` |
| Client Authentication | Send as Basic Auth header |

4. 「Get New Access Token」ボタンをクリック
5. ブラウザでXのログイン・認可画面が開くので承認する
6. Postman に戻ると「Manage Access Tokens」が表示される
7. `refresh_token` の値をコピーしておく

---

### Step 3: Supabase に登録

Supabase の SQL Editor を開いて以下を実行：

```sql
-- 初回（レコードがない場合）
INSERT INTO x_tokens (id, refresh_token, updated_at)
VALUES (1, 'ここにコピーしたrefresh_tokenを貼り付け', now());

-- すでにレコードがある場合（上書き）
UPDATE x_tokens
SET refresh_token = 'ここにコピーしたrefresh_tokenを貼り付け',
    updated_at = now()
WHERE id = 1;
```

2アカウント目を追加する場合は `id = 2` で同様に実行し、Vercel環境変数 `X_ACCOUNT_ID=2` を設定する。

---

## 環境変数一覧

### Vercel に設定するもの

| キー | 説明 |
|---|---|
| `X_CLIENT_ID` | X Developer Portal のOAuth 2.0 Client ID |
| `X_API_APP_SECRET` | X Developer Portal のOAuth 2.0 Client Secret |
| `X_API_MODE` | `new`（OAuth2スレッド投稿）または `legacy` |
| `X_ACCOUNT_ID` | Supabaseの `x_tokens` テーブルの `id`（省略時は1） |
| `OPENAI_API_KEY` | OpenAI APIキー |
| `OPENAI_MODEL` | 使用するモデル名（例: `gpt-4o-mini`） |
| `SUPABASE_URL` | Supabase プロジェクトURL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `RAKUTEN_APP_ID` | 楽天アプリID |
| `RAKUTEN_APP_ACCESS_KEY` | 楽天アクセスキー |
| `RAKUTEN_AFFILIATE_ID` | 楽天アフィリエイトID |
| `AMAZON_CLIENT_ID` | Amazon Creators API Client ID |
| `AMAZON_CLIENT_SECRET` | Amazon Creators API Client Secret |
| `AMAZON_MARKETPLACE` | `www.amazon.co.jp` |
| `AMAZON_PARTNER_TAG` | Amazonアソシエイトのパートナータグ |

### Supabase に保存するもの（環境変数ではない）

| テーブル | カラム | 説明 |
|---|---|---|
| `x_tokens` | `refresh_token` | Xのリフレッシュトークン（使うたびに自動更新） |
