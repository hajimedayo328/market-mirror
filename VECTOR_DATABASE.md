# Vector Database（ベクトルデータベース）実装

## 📋 概要

本システムでは、**pgvector**を使用してPostgreSQLに**ベクトル検索機能**を実装しています。
これにより、キーワードの完全一致ではなく、**意味的な類似性**に基づいてアイデアを検索できます。

---

## 🎯 実装機能

### 1. セマンティック類似検索
アイデアの内容を数値ベクトル（埋め込み）に変換し、類似したアイデアを自動的に発見します。

### 2. 自動埋め込み生成
新しいアイデアが作成されると、バックグラウンドで自動的に埋め込みベクトルを生成します。

### 3. レポートページ統合
各アイデアのレポートページに「類似アイデア」セクションを表示し、過去の関連アイデアを提示します。

---

## 🏗️ 技術スタック

### pgvector
- **バージョン**: PostgreSQL 16 + pgvector extension
- **ベクトル次元**: 1536次元（OpenAI text-embedding-ada-002互換）
- **距離関数**: コサイン距離（`<=>`）

### 埋め込みモデル
- **本番環境**: OpenAI `text-embedding-ada-002`
- **開発環境**: 決定的なモック埋め込み（API不要）

---

## 📊 データベース設計

### Ideaテーブルの拡張

```prisma
model Idea {
  // ... 既存のフィールド
  embedding Unsupported("vector(1536)")?  // 埋め込みベクトル
}
```

### SQL例

```sql
-- pgvector拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 埋め込みカラムを追加
ALTER TABLE ideas 
ADD COLUMN embedding vector(1536);

-- ベクトル検索用のインデックス（IVFFlat）
CREATE INDEX ON ideas 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## 🔍 検索クエリ

### 類似アイデアの検索

```typescript
// アイデアID=5 に最も似たアイデアを3件取得
const similarIdeas = await prisma.$queryRaw`
  SELECT 
    id,
    title,
    1 - (embedding <=> (SELECT embedding FROM ideas WHERE id = 5)) as similarity
  FROM ideas
  WHERE id != 5 AND embedding IS NOT NULL
  ORDER BY embedding <=> (SELECT embedding FROM ideas WHERE id = 5)
  LIMIT 3
`;
```

### 距離関数の種類

| 演算子 | 距離関数 | 用途 |
|--------|---------|------|
| `<->` | L2距離（ユークリッド距離） | 一般的な類似度 |
| `<#>` | 内積（マイナス） | 正規化済みベクトル |
| `<=>` | **コサイン距離** | テキスト埋め込み（推奨） |

---

## 💻 実装詳細

### 1. 埋め込み生成（`lib/embeddings.ts`）

```typescript
export async function generateEmbedding(text: string): Promise<number[]> {
  // API キーがある場合: OpenAI API
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002',
      }),
    });
    return response.data[0].embedding;
  }
  
  // API キーがない場合: モック埋め込み
  return generateMockEmbedding(text);
}
```

### 2. モック埋め込み生成

開発環境では、テキストから**決定的な**1536次元ベクトルを生成します：

```typescript
function generateMockEmbedding(text: string): number[] {
  // 1. テキストをハッシュ化
  // 2. キーワード抽出（AI, 家計簿, 翻訳など）
  // 3. シード値を使って再現性のある乱数生成
  // 4. 正規化してユニットベクトルに変換
  return normalizedVector;
}
```

**特徴:**
- 同じテキスト → 同じベクトル（再現性）
- キーワードが共通 → 類似度が高い
- API不要で動作

### 3. Server Actions（`app/actions-vector.ts`）

#### ① 埋め込み生成

```typescript
export async function generateIdeaEmbedding(ideaId: number) {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  const text = `${idea.title}\n\n${idea.description}`;
  const embedding = await generateEmbedding(text);
  
  await prisma.$executeRaw`
    UPDATE ideas 
    SET embedding = ${JSON.stringify(embedding)}::vector 
    WHERE id = ${ideaId}
  `;
}
```

#### ② 類似検索

```typescript
export async function findSimilarIdeas(ideaId: number, limit: number = 5) {
  const similarIdeas = await prisma.$queryRaw`
    SELECT 
      id, title, description,
      1 - (embedding <=> (SELECT embedding FROM ideas WHERE id = ${ideaId})) as similarity
    FROM ideas
    WHERE id != ${ideaId} AND embedding IS NOT NULL
    ORDER BY embedding <=> (SELECT embedding FROM ideas WHERE id = ${ideaId})
    LIMIT ${limit}
  `;
  
  return similarIdeas;
}
```

### 4. UIコンポーネント（`components/SimilarIdeas.tsx`）

レポートページに類似アイデアを表示：

```tsx
export async function SimilarIdeas({ ideaId }: { ideaId: number }) {
  const result = await findSimilarIdeas(ideaId, 3);
  
  return (
    <div>
      {result.ideas.map(idea => (
        <Link href={`/report/${idea.id}`}>
          <h3>{idea.title}</h3>
          <p>類似度: {idea.similarity}%</p>
        </Link>
      ))}
    </div>
  );
}
```

---

## 🚀 セットアップ手順

### 1. Dockerコンテナ再起動

```bash
# 既存のコンテナを停止
docker-compose down

# pgvector付きPostgreSQLで起動
docker-compose up -d
```

### 2. pgvector拡張を有効化

```bash
# PostgreSQLに接続
docker exec -it market_mirror_db psql -U user -d market_mirror

# 拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

# 確認
\dx
```

### 3. マイグレーション実行

```bash
npx prisma migrate dev --name add_vector_embedding
```

### 4. 既存アイデアの埋め込み生成

```bash
# 開発サーバー起動
cd market-mirror
npm run dev

# 別ターミナルでスクリプト実行
npx tsx -e "
import { generateAllEmbeddings } from './app/actions-vector';
generateAllEmbeddings().then(console.log);
"
```

---

## 📊 使用例

### ケース1: 「AI家計簿アプリ」に似たアイデアを探す

**入力:**
```
タイトル: AI家計簿アプリ「スマート・マネー」
説明: レシートを撮影するだけで自動記録。AIが節約アドバイス。
```

**検索結果:**
1. **家計管理ツール** - 類似度 87%
2. **スマート支出トラッカー** - 類似度 82%
3. **AI予算アシスタント** - 類似度 79%

### ケース2: 「観光アプリ」に似たアイデアを探す

**入力:**
```
タイトル: AI翻訳機能付き観光マップ
説明: リアルタイム翻訳で外国人観光客をサポート。
```

**検索結果:**
1. **多言語対応ガイドアプリ** - 類似度 91%
2. **訪日外国人向けナビ** - 類似度 85%
3. **観光地音声案内システム** - 類似度 78%

---

## 🎓 データベース課題での活用

### 先生へのアピールポイント

1. **最新技術の活用**
   - pgvectorによるベクトル検索
   - AIとデータベースの統合

2. **高度なクエリ**
   - 生SQLでのベクトル演算
   - コサイン距離による類似度計算

3. **実用的な機能**
   - セマンティック検索の実装
   - ユーザー体験の向上

### 説明のポイント

```markdown
本システムでは、通常のリレーショナルデータベース（PostgreSQL）に加えて、
pgvector拡張機能を使用した**ベクトルデータベース**を実装しています。

これにより、キーワードの完全一致ではなく、「文脈」や「意図」の類似性に基づいて
過去のアイデアを検索できます。

例えば、「AI家計簿」というアイデアを検索すると、
「スマート財務管理」や「自動予算アシスタント」といった、
キーワードは異なるが**意味的に類似したアイデア**を発見できます。
```

---

## 🔬 技術的な補足

### コサイン類似度の計算

```
similarity = 1 - cosine_distance
           = 1 - (1 - dot_product / (|A| * |B|))
           = dot_product / (|A| * |B|)
```

ベクトルが正規化されている場合（||v|| = 1）:
```
similarity = dot_product(A, B)
```

### インデックス戦略

```sql
-- IVFFlat（高速だが近似）
CREATE INDEX ON ideas USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- HNSW（より高精度だが遅い）
CREATE INDEX ON ideas USING hnsw (embedding vector_cosine_ops);
```

---

## 📞 トラブルシューティング

### Q: 類似アイデアが表示されない
A: 埋め込みが生成されていない可能性があります。`generateAllEmbeddings()`を実行してください。

### Q: OpenAI APIエラーが出る
A: 環境変数`OPENAI_API_KEY`が設定されていない場合、自動的にモック埋め込みを使用します。

### Q: ベクトル検索が遅い
A: インデックスを作成してください（上記「インデックス戦略」参照）。

---

**作成日**: 2025-12-21  
**最終更新**: 2025-12-21

