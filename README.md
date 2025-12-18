# Market Mirror

100人のAIペルソナによる市場検証アプリ

## 📋 プロジェクト概要

ビジネスアイデアを入力すると、100人の多様なペルソナが辛口レビューを行い、改善案（North Star）を導き出すツール。

## 🛠 技術スタック

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Docker), Prisma ORM v6
- **Visual**: Nano Banana (予定)

## 📦 現在の開発状況

### ✅ 完了した作業

1. **データベース環境構築**
   - PostgreSQL（Docker環境）
   - ポート: 5432
   - データベース名: market_mirror
   - ユーザー: user / パスワード: password

2. **Prismaセットアップ**
   - スキーマ定義完了
   - マイグレーション適用済み
   - シードデータ投入済み

3. **データモデル**
   - `Idea`: ビジネスアイデア
   - `Persona`: AIペルソナ（5人分のサンプルデータあり）
   - `Review`: 評価・レビュー（2件のサンプルデータあり）

### 🔄 次のステップ

- [ ] Next.js APIルートの作成
- [ ] フロントエンドUIの実装
- [ ] AIペルソナによるレビュー生成ロジック
- [ ] 残り95人のペルソナデータ作成

## 🚀 セットアップ手順（次回起動時）

```bash
# 1. プロジェクトディレクトリに移動
cd C:\Users\赤塩甫\OneDrive\ドキュメント\授業\データベース\finalapp

# 2. データベースを起動
cd market-mirror
docker compose up -d
cd ..

# 3. Prisma Studioでデータ確認（オプション）
npx prisma studio
```

## 📁 プロジェクト構造

```
finalapp/
├── prisma/
│   ├── schema.prisma       # データモデル定義
│   ├── seed.ts             # シードデータ
│   └── migrations/         # マイグレーションファイル
├── market-mirror/
│   └── docker-compose.yml  # PostgreSQL設定
├── .env                    # 環境変数（DATABASE_URL）
├── package.json
└── README.md
```

## 🗄️ データベース接続情報

```
DATABASE_URL="postgresql://user:password@localhost:5432/market_mirror?schema=public"
```

## 📝 重要な注意事項

- Prisma 7から6にダウングレード済み（互換性の問題のため）
- `.env`ファイルは`.gitignore`で除外済み
- シードデータは`npx tsx prisma/seed.ts`で再投入可能

## 🎯 プロジェクトのゴール

辛口レビューを通じて、ビジネスアイデアの市場性を多角的に検証し、改善の方向性を示すツールを作る。

---

**最終更新**: 2025年12月18日  
**GitHub**: https://github.com/hajimedayo328/market-mirror

