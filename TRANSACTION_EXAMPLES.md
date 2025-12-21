# トランザクション処理の実装例

このドキュメントでは、Market Mirrorアプリケーションで使用するトランザクション処理の実装例を示します。

## 目次
1. [基本的なトランザクション](#基本的なトランザクション)
2. [複数レビューの一括作成](#複数レビューの一括作成)
3. [エラーハンドリングとロールバック](#エラーハンドリングとロールバック)
4. [アイデアと初期レビューの同時作成](#アイデアと初期レビューの同時作成)

---

## 基本的なトランザクション

Prismaの`$transaction`を使用した基本的なトランザクション処理：

```typescript
import { prisma } from '@/lib/prisma';

async function createIdeaWithTransaction(data: IdeaData) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. アイデアを作成
      const idea = await tx.idea.create({
        data: {
          title: data.title,
          description: data.description,
          targetAudience: data.targetAudience,
          category: data.category,
        },
      });

      // 2. 作成されたアイデアを返す
      return idea;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Transaction failed:', error);
    return { success: false, error: 'アイデアの作成に失敗しました' };
  }
}
```

---

## 複数レビューの一括作成

AIによる複数ペルソナのレビューを一括で作成する例：

```typescript
async function createBulkReviews(ideaId: number, reviews: ReviewData[]) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. アイデアが存在するか確認
      const idea = await tx.idea.findUnique({
        where: { id: ideaId },
      });

      if (!idea) {
        throw new Error('Idea not found');
      }

      // 2. 全てのレビューを作成
      const createdReviews = await Promise.all(
        reviews.map((review) =>
          tx.review.create({
            data: {
              ideaId: ideaId,
              personaId: review.personaId,
              score: review.score,
              comment: review.comment,
              willBuy: review.willBuy,
              improvementSuggestion: review.improvementSuggestion,
              pricePerception: review.pricePerception,
              trustLevel: review.trustLevel,
            },
          })
        )
      );

      // 3. 作成されたレビューの統計を計算
      const avgScore = 
        createdReviews.reduce((sum, r) => sum + r.score, 0) / 
        createdReviews.length;

      const buyCount = createdReviews.filter(r => r.willBuy).length;

      return {
        reviews: createdReviews,
        stats: {
          totalReviews: createdReviews.length,
          avgScore: avgScore,
          buyCount: buyCount,
          buyPercentage: (buyCount / createdReviews.length) * 100,
        },
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Bulk review creation failed:', error);
    return { success: false, error: 'レビューの作成に失敗しました' };
  }
}
```

---

## エラーハンドリングとロールバック

トランザクション内でエラーが発生した場合の処理：

```typescript
async function safeCreateReview(data: ReviewData) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. ペルソナが存在するか確認
      const persona = await tx.persona.findUnique({
        where: { id: data.personaId },
      });

      if (!persona) {
        throw new Error('Persona not found');
      }

      // 2. アイデアが存在するか確認
      const idea = await tx.idea.findUnique({
        where: { id: data.ideaId },
      });

      if (!idea) {
        throw new Error('Idea not found');
      }

      // 3. 既にレビューが存在しないか確認
      const existingReview = await tx.review.findUnique({
        where: {
          ideaId_personaId: {
            ideaId: data.ideaId,
            personaId: data.personaId,
          },
        },
      });

      if (existingReview) {
        throw new Error('Review already exists');
      }

      // 4. スコアのバリデーション
      if (data.score < 1 || data.score > 10) {
        throw new Error('Score must be between 1 and 10');
      }

      // 5. レビューを作成
      const review = await tx.review.create({
        data: {
          ideaId: data.ideaId,
          personaId: data.personaId,
          score: data.score,
          comment: data.comment,
          willBuy: data.willBuy,
          improvementSuggestion: data.improvementSuggestion,
          pricePerception: data.pricePerception,
          trustLevel: data.trustLevel,
        },
      });

      return review;
    });

    return { success: true, data: result };
  } catch (error) {
    // エラーが発生した場合、全ての変更が自動的にロールバックされる
    console.error('Transaction rolled back:', error);
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: '不明なエラーが発生しました' };
  }
}
```

---

## アイデアと初期レビューの同時作成

アイデアの作成と同時に、サンプルレビューも作成する例：

```typescript
async function createIdeaWithInitialReviews(
  ideaData: IdeaData,
  personaIds: number[]
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. アイデアを作成
      const idea = await tx.idea.create({
        data: {
          title: ideaData.title,
          description: ideaData.description,
          targetAudience: ideaData.targetAudience,
          category: ideaData.category,
        },
      });

      // 2. 選択されたペルソナを取得
      const personas = await tx.persona.findMany({
        where: {
          id: { in: personaIds },
          category: ideaData.category, // カテゴリが一致するペルソナのみ
        },
      });

      if (personas.length === 0) {
        throw new Error('No valid personas found for this category');
      }

      // 3. 初期レビュー（プレースホルダー）を作成
      const initialReviews = await Promise.all(
        personas.map((persona) =>
          tx.review.create({
            data: {
              ideaId: idea.id,
              personaId: persona.id,
              score: 5, // 初期値
              comment: 'レビュー待機中...',
              willBuy: false,
              improvementSuggestion: 'AI評価を実行してください',
            },
          })
        )
      );

      return {
        idea: idea,
        reviews: initialReviews,
        personaCount: personas.length,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Transaction failed:', error);
    return { success: false, error: 'アイデアの作成に失敗しました' };
  }
}
```

---

## 分離レベルの設定

Prismaでトランザクション分離レベルを指定する例：

```typescript
async function createReviewWithIsolation(data: ReviewData) {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // トランザクション内の処理
        const review = await tx.review.create({
          data: {
            ideaId: data.ideaId,
            personaId: data.personaId,
            score: data.score,
            comment: data.comment,
            willBuy: data.willBuy,
            improvementSuggestion: data.improvementSuggestion,
          },
        });

        return review;
      },
      {
        isolationLevel: 'Serializable', // 最も厳格な分離レベル
        maxWait: 5000, // 最大待機時間（ミリ秒）
        timeout: 10000, // タイムアウト時間（ミリ秒）
      }
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Transaction failed:', error);
    return { success: false, error: 'レビューの作成に失敗しました' };
  }
}
```

---

## 使用例とベストプラクティス

### 1. いつトランザクションを使うべきか

**使うべき場合:**
- 複数のテーブルを更新する場合
- データの整合性が重要な場合
- 失敗時にロールバックが必要な場合
- 複数の操作が全て成功する必要がある場合

**使わなくても良い場合:**
- 単一のテーブルへの単純な挿入・更新
- 読み取り専用の操作
- データの整合性が重要でない場合

### 2. パフォーマンスの考慮事項

```typescript
// ❌ 悪い例: トランザクション内で重い処理
await prisma.$transaction(async (tx) => {
  const idea = await tx.idea.create({ data });
  
  // 外部API呼び出し（遅い！）
  const aiReview = await callAIAPI(idea); // これはトランザクション外でやるべき
  
  await tx.review.create({ data: aiReview });
});

// ✅ 良い例: トランザクション外で重い処理
const aiReview = await callAIAPI(ideaData); // 先に実行

await prisma.$transaction(async (tx) => {
  const idea = await tx.idea.create({ data });
  await tx.review.create({ data: { ...aiReview, ideaId: idea.id } });
});
```

### 3. エラーハンドリングのパターン

```typescript
try {
  await prisma.$transaction(async (tx) => {
    // 処理...
  });
} catch (error) {
  if (error.code === 'P2002') {
    // ユニーク制約違反
    return { error: '既に存在します' };
  } else if (error.code === 'P2003') {
    // 外部キー制約違反
    return { error: '関連データが見つかりません' };
  } else {
    // その他のエラー
    return { error: 'エラーが発生しました' };
  }
}
```

---

## まとめ

トランザクションを適切に使用することで：

1. **データの整合性** - 複数の操作が全て成功または全て失敗することを保証
2. **エラーハンドリング** - 問題が発生した場合の自動ロールバック
3. **ACID特性の保証** - Atomicity（原子性）、Consistency（一貫性）、Isolation（独立性）、Durability（永続性）

これらの実装パターンを参考に、アプリケーションの要件に応じて適切なトランザクション処理を実装してください。

---

作成日: 2025-12-19



