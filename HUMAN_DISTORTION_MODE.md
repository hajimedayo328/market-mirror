# Human Distortion Mode（人間的歪み機能）

## 📋 概要

**Human Distortion Mode**は、AIの評価に「人間らしい非合理性」を加える革新的な機能です。
完全に論理的なAI評価に、社会的圧力、感情、偏見、タイミングといった「人間的な歪み」を混ぜることで、
より現実に近い市場反応をシミュレートします。

---

## 🎯 4つの歪みモード

### 1. Social Pressure（同調圧力）🎭
- **影響範囲:** インフルエンサーの後に評価する27人のFollowers
- **効果:** 「空気を読む」日本的な意思決定をシミュレート
- **実装:**
  - 0%: 各ペルソナが独立して評価（完全Rational）
  - >0%: 2段階処理
    1. 最初の3人のInfluencersが評価
    2. その結果を「場の空気」として残りの27人に注入
    3. 設定された%の強さで、Followersの評価がInfluencersに引っ張られる

### 2. Emotional（感情）😤
- **影響範囲:** 全30人
- **効果:** 論理的整合性より「その時の気分」を優先
- **実装:**
  - 0%: 論理的判断のみ
  - >0%: ランダムな気分（機嫌が良い、イライラ、ハイテンション等）で評価が変動
  - スコアへの影響: 最大±3点

### 3. Bias（偏見）🤔
- **影響範囲:** 全30人
- **効果:** 客観的評価より「個人的な好き嫌い」を優先
- **実装:**
  - 0%: 客観的な市場価値で判断
  - >0%: ペルソナの`hidden_bias`を強く反映
  - スコアへの影響: 最大±2点

### 4. Temporal（タイミング）⏰
- **影響範囲:** 全30人
- **効果:** 時間帯や曜日による心理状態を考慮
- **実装:**
  - 0%: 時間に影響されない評価
  - >0%: 「月曜朝の憂鬱」「金曜夜の開放感」などのコンテキストを付与
  - スコアへの影響: 最大±2点

---

## 🏗️ システム設計

### データベース設計

```prisma
model AnalysisJob {
  // ... 他のフィールド
  distortionWeights Json?  // { social: 0-100, emotional: 0-100, bias: 0-100, temporal: 0-100 }
}
```

### UIコンポーネント

**DistortionPanel** (`app/components/DistortionPanel.tsx`)
- 折りたたみ可能なパネル
- 4つのスライダー（0% 〜 100%, 10%刻み）
- リアルタイムで平均歪み度を表示
- Hidden inputsでフォームデータとして送信

### バックエンドロジック

#### フロー制御 (Worker)

```typescript
if (distortionWeights.social > 0) {
  // === 2段階処理 ===
  
  // Step 1: Influencers (3人)
  const influencerReviews = await Promise.all(
    influencers.map(persona => 
      mockAIEvaluate(persona, idea, distortionWeights)
    )
  );
  
  // Step 2: Context Injection
  const context = `インフルエンサー3人の評価: 平均${avgScore}点。`;
  
  // Step 3: Followers (27人)
  const followerReviews = await Promise.all(
    followers.map(persona => 
      mockAIEvaluate(persona, idea, distortionWeights, context)
    )
  );
} else {
  // === Rational Mode (全員並列) ===
  const reviews = await Promise.all(
    personas.map(persona => 
      mockAIEvaluate(persona, idea, distortionWeights)
    )
  );
}
```

#### プロンプト生成

```typescript
function generateDistortionPrompts(weights, context?) {
  const prompts = [];
  
  if (weights.social > 0 && context) {
    prompts.push(`【重要】周囲の空気を${weights.social}%の強さで優先してください。`);
  }
  
  if (weights.emotional > 0) {
    prompts.push(`【重要】現在の気分で${weights.emotional}%判断してください。`);
  }
  
  if (weights.bias > 0) {
    prompts.push(`【重要】個人的な好みを${weights.bias}%強く反映してください。`);
  }
  
  if (weights.temporal > 0) {
    prompts.push(`【重要】時間帯のコンテキストを${weights.temporal}%考慮してください。`);
  }
  
  return prompts.join('\n\n');
}
```

#### スコア調整ロジック

```typescript
let baseScore = Math.floor(random(seed) * 5) + 5; // 5-9

// 1. Social Pressure
if (weights.social > 0 && context) {
  const influence = (weights.social / 100) * 2; // 最大±2点
  if (influencerAvg >= 8) baseScore += influence;
  if (influencerAvg <= 6) baseScore -= influence;
}

// 2. Emotional
if (weights.emotional > 0) {
  const swing = randomSwing() * (weights.emotional / 100) * 3; // 最大±3点
  baseScore += swing;
}

// 3. Bias
if (weights.bias > 0) {
  const swing = randomSwing() * (weights.bias / 100) * 2; // 最大±2点
  baseScore += swing;
}

// 4. Temporal
if (weights.temporal > 0) {
  const swing = randomSwing() * (weights.temporal / 100) * 2; // 最大±2点
  baseScore += swing;
}

const finalScore = Math.round(Math.max(1, Math.min(10, baseScore)));
```

---

## 📊 使用方法

### 1. トップページでアイデアを入力

### 2. Human Distortion Modeパネルを展開

### 3. 4つのスライダーで歪み度を調整
- **すべて0%**: 完全に合理的な評価（Rational Mode）
- **Social 50%, 他0%**: 中程度の同調圧力のみ
- **全部100%**: 極度に非合理的な評価（Highly Distorted）

### 4. 検証を開始
- Social > 0%の場合: インフルエンサーモデル（2段階処理）
- Social == 0%の場合: 全員並列評価

### 5. レポートページで結果確認
- 各ペルソナのコメントに「評価条件」が表示される
- 歪みの影響でスコアが変動する様子を確認できる

---

## 🎯 実例

### ケース1: 完全Rationalモード
```
設定: { social: 0, emotional: 0, bias: 0, temporal: 0 }
結果: 各ペルソナが独立して論理的に評価
平均スコア: 7.2点（安定）
```

### ケース2: 強い同調圧力
```
設定: { social: 100, emotional: 0, bias: 0, temporal: 0 }
結果: Influencersが高評価 → Followersも高評価に引きずられる
平均スコア: 8.5点（インフルエンサー効果で+1.3点）
```

### ケース3: 感情的な評価
```
設定: { social: 0, emotional: 100, bias: 0, temporal: 0 }
結果: 気分でスコアが大きく変動
平均スコア: 7.0点（標準偏差が大きい）
```

### ケース4: すべて最大
```
設定: { social: 100, emotional: 100, bias: 100, temporal: 100 }
結果: 極度に非合理的な評価
平均スコア: 6.8点（予測不可能）
```

---

## 🔬 技術的な詳細

### 複合的な歪み

複数の歪みが設定された場合、すべてが加算的に作用します：

```typescript
finalScore = baseScore 
  + socialEffect 
  + emotionalEffect 
  + biasEffect 
  + temporalEffect;
```

### 再現性の確保

- シード値を使用してランダム性を制御
- 同じアイデア+ペルソナ+歪み設定 → 同じ結果

### パフォーマンス最適化

- Social > 0: 3人 → 27人（2段階）
- Social == 0: 30人同時並列（最速）

---

## 🚀 今後の拡張

### 1. リアルAI統合時

```typescript
const systemPrompt = `
あなたは${persona.name}です。

${generateDistortionPrompts(weights, context)}

【重要】上記すべての制約を考慮して、人間らしく非合理的に振る舞ってください。
`;
```

### 2. 歪みプリセット

- 「日本企業の稟議」: social 90%, emotional 10%, bias 50%, temporal 30%
- 「スタートアップPitch」: social 30%, emotional 70%, bias 40%, temporal 20%
- 「BtoC新製品」: social 60%, emotional 80%, bias 70%, temporal 50%

### 3. 歪みの可視化

- レポートページに歪み度のグラフを追加
- 各ペルソナがどの歪みに最も影響されたかを表示

---

## 📞 トラブルシューティング

### Q: すべて0%にしても評価が変わる？
A: ベーススコアはランダム（5-9点）です。完全に固定するには別のロジックが必要です。

### Q: Social 100%でも同調しない人がいる？
A: Influencersは常に独立評価です。Followersのみが影響を受けます。

### Q: 歪みを100%にしてもスコアが1点にならない？
A: 最大/最小値（1点/10点）でクランプされています。

---

**作成日**: 2025-12-21  
**最終更新**: 2025-12-21

