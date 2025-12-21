# PDCA機能 - 正式仕様書

## 🎯 コンセプト

**AIが自動でPDCAサイクルを回し、ビジネスアイデアを継続的に改善する**

---

## 🔄 完全なフロー

### 1. Plan（初回のみ人間）
```
人間がアイデアを入力
├─ タイトル
├─ 詳細説明
├─ ターゲット層
└─ デッキ選択
```

### 2. Do（AI自動実行）
```
選択されたペルソナ10人がAIで評価
├─ スコア（1-10）
├─ コメント
├─ 購入意向（Yes/No）
└─ 改善提案
```

### 3. Check（AI自動分析）
```
AIがレビュー結果を分析
├─ 平均スコア
├─ 購入意向率
├─ 共通の課題を抽出
└─ 改善ポイントの特定
```

### 4. Act（AI自動改善）
```
AIが改善案を自動生成
├─ フィードバックを反映
├─ 新しいタイトル生成
├─ 新しい詳細説明生成
└─ 次のバージョンとして保存
```

### 5. Loop（自動繰り返し）
```
2→3→4を任意のN回繰り返す
├─ v1 → v2 → v3 → ... → vN
├─ 各バージョンでスコア向上を確認
└─ 目標スコアに達したら終了（またはN回で終了）
```

### 6. Export（結果出力）
```
最終結果を可視化
├─ スライド生成（PowerPoint）
├─ インフォグラフィック生成
├─ 改善履歴のグラフ
└─ PDFエクスポート
```

---

## 🎨 UI/UX フロー

### ステップ1: アイデア入力画面
```
┌─────────────────────────────────┐
│ Market Mirror - アイデア入力    │
├─────────────────────────────────┤
│ デッキ選択: ○ Standard_Japan   │
│            ○ Inbound_Tourist   │
│            ○ Biz_Tech          │
│                                 │
│ タイトル: [____________]        │
│ 詳細説明: [____________]        │
│                                 │
│  [🚀 PDCAを開始]               │
└─────────────────────────────────┘
```

### ステップ2: PDCA設定画面
```
┌─────────────────────────────────┐
│ PDCA実行設定                    │
├─────────────────────────────────┤
│ 実行モード:                     │
│ ○ 自動（AIが改善案を生成）    │
│ ○ 手動（人間が確認しながら）  │
│                                 │
│ 実行回数:                       │
│ ○ 3回  ○ 5回  ○ 10回         │
│ ○ スコア8.0以上まで            │
│                                 │
│  [▶️ 実行開始]                 │
└─────────────────────────────────┘
```

### ステップ3: PDCA実行画面（リアルタイム）
```
┌─────────────────────────────────┐
│ PDCA実行中... (2/5完了)        │
├─────────────────────────────────┤
│ ✅ v1: スコア 6.5 → ペルソナ評価完了│
│ ✅ v2: スコア 7.8 → 改善案生成完了  │
│ 🔄 v3: 評価中... [████░░] 60%    │
│ ⏳ v4: 待機中                     │
│ ⏳ v5: 待機中                     │
│                                 │
│ [⏸️ 一時停止] [⏹️ 停止]       │
└─────────────────────────────────┘
```

### ステップ4: 結果画面
```
┌─────────────────────────────────┐
│ 🎉 PDCA完了！                   │
├─────────────────────────────────┤
│ 📊 改善結果                     │
│   v1: 6.5 → v5: 8.9 (+2.4)    │
│                                 │
│ 📈 [改善グラフを見る]           │
│ 📄 [詳細レポート]               │
│ 🎨 [スライド生成]               │
│ 📊 [インフォグラフィック生成]  │
└─────────────────────────────────┘
```

---

## 🔧 技術実装

### 1. AIによる評価生成

```typescript
// 各ペルソナがアイデアを評価
async function generateReview(ideaId: number, personaId: number) {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  const persona = await prisma.persona.findUnique({ where: { id: personaId } });
  
  const prompt = `
あなたは以下のペルソナです：
${JSON.stringify(persona)}

以下のビジネスアイデアを評価してください：
タイトル: ${idea.title}
説明: ${idea.description}

以下の形式でJSON形式で返してください：
{
  "score": 1-10の数値,
  "comment": "評価コメント",
  "willBuy": true/false,
  "improvementSuggestion": "具体的な改善提案"
}
  `;
  
  const response = await ai.generate(prompt);
  
  await prisma.review.create({
    data: {
      ideaId,
      personaId,
      ...JSON.parse(response),
    },
  });
}
```

### 2. AIによる改善案生成

```typescript
// レビュー結果から改善案を自動生成
async function generateImprovedIdea(ideaId: number) {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { reviews: { include: { persona: true } } },
  });
  
  // 共通の改善提案を抽出
  const suggestions = idea.reviews.map(r => r.improvementSuggestion);
  
  const prompt = `
以下のビジネスアイデアとペルソナからのフィードバックを元に、
改善されたアイデアを生成してください。

【元のアイデア】
タイトル: ${idea.title}
説明: ${idea.description}

【フィードバック】
${suggestions.join('\n')}

【改善されたアイデアをJSON形式で返してください】
{
  "title": "改善されたタイトル",
  "description": "改善された詳細説明",
  "improvementReason": "どこをどう改善したか"
}
  `;
  
  const response = await ai.generate(prompt);
  const improved = JSON.parse(response);
  
  // 新バージョンとして保存
  const newIdea = await prisma.idea.create({
    data: {
      title: improved.title,
      description: improved.description,
      targetAudience: idea.targetAudience,
      category: idea.category,
      version: idea.version + 1,
      parentId: ideaId,
      status: 'draft',
    },
  });
  
  return newIdea;
}
```

### 3. 自動PDCAループ

```typescript
// N回PDCAを自動実行
async function runPDCACycle(initialIdeaId: number, cycles: number) {
  let currentIdeaId = initialIdeaId;
  const results = [];
  
  for (let i = 0; i < cycles; i++) {
    // 1. ペルソナによる評価（Do）
    const idea = await prisma.idea.findUnique({ 
      where: { id: currentIdeaId } 
    });
    const personas = await prisma.persona.findMany({
      where: { category: idea.category },
    });
    
    // 全ペルソナで評価
    await Promise.all(
      personas.map(p => generateReview(currentIdeaId, p.id))
    );
    
    // 2. 結果分析（Check）
    const reviews = await prisma.review.findMany({
      where: { ideaId: currentIdeaId },
    });
    const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
    
    results.push({
      version: idea.version,
      ideaId: currentIdeaId,
      score: avgScore,
    });
    
    // 最終サイクルなら終了
    if (i === cycles - 1) break;
    
    // 3. 改善案生成（Act → Plan）
    const improvedIdea = await generateImprovedIdea(currentIdeaId);
    currentIdeaId = improvedIdea.id;
    
    // 進捗を通知（WebSocketなど）
    notifyProgress({
      cycle: i + 1,
      totalCycles: cycles,
      currentScore: avgScore,
    });
  }
  
  return results;
}
```

### 4. スライド生成

```typescript
import pptxgen from 'pptxgenjs';

async function generateSlide(ideaId: number) {
  const pptx = new pptxgen();
  
  // タイトルスライド
  const slide1 = pptx.addSlide();
  slide1.addText('Market Mirror - PDCA結果', {
    x: 1, y: 1, fontSize: 44, bold: true,
  });
  
  // 改善履歴グラフ
  const slide2 = pptx.addSlide();
  const history = await getIdeaHistory(ideaId);
  slide2.addChart(pptx.ChartType.line, 
    history.versions.map(v => ({
      name: `v${v.version}`,
      values: [v.avgScore],
    }))
  );
  
  // 各バージョンの詳細
  for (const version of history.versions) {
    const slide = pptx.addSlide();
    slide.addText(`バージョン ${version.version}`, { fontSize: 32 });
    slide.addText(version.title, { fontSize: 24 });
    slide.addText(`スコア: ${version.avgScore}`, { fontSize: 18 });
  }
  
  // ファイル保存
  await pptx.writeFile({ fileName: `pdca-result-${ideaId}.pptx` });
}
```

### 5. インフォグラフィック生成

```typescript
import { createCanvas } from 'canvas';

async function generateInfographic(ideaId: number) {
  const canvas = createCanvas(1200, 800);
  const ctx = canvas.getContext('2d');
  
  const history = await getIdeaHistory(ideaId);
  
  // 背景
  ctx.fillStyle = '#f0f4f8';
  ctx.fillRect(0, 0, 1200, 800);
  
  // タイトル
  ctx.fillStyle = '#1a202c';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('PDCA改善結果', 50, 80);
  
  // グラフ描画
  const versions = history.versions;
  versions.forEach((v, i) => {
    const x = 100 + i * 200;
    const y = 400 - v.avgScore * 30;
    
    // バージョンドット
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // スコア表示
    ctx.fillStyle = '#1a202c';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`v${v.version}`, x - 15, y + 50);
    ctx.fillText(v.avgScore.toString(), x - 20, y - 30);
    
    // 線で接続
    if (i > 0) {
      const prevX = 100 + (i - 1) * 200;
      const prevY = 400 - versions[i - 1].avgScore * 30;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  });
  
  // PNG保存
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(`pdca-infographic-${ideaId}.png`, buffer);
}
```

---

## 📊 データベース構造（変更なし）

現在の構造でOK：
- `version`: バージョン番号
- `parentId`: 親アイデア
- `status`: draft / improved

---

## 🎯 実装優先順位

### Phase 1: AI評価機能（必須）
1. ✅ データベース構造（完了）
2. ⏳ AI APIとの統合
3. ⏳ ペルソナによる評価生成

### Phase 2: AI改善案生成（コア機能）
4. ⏳ フィードバック分析
5. ⏳ 改善案の自動生成
6. ⏳ 新バージョンの自動作成

### Phase 3: 自動PDCAループ
7. ⏳ N回自動実行機能
8. ⏳ リアルタイム進捗表示
9. ⏳ 目標スコア到達で自動停止

### Phase 4: 結果出力
10. ⏳ スライド生成
11. ⏳ インフォグラフィック生成
12. ⏳ PDFエクスポート

---

## 🚀 次のステップ

APIキーが用意できたら：
1. AI評価機能を実装
2. AI改善案生成を実装
3. 自動PDCAループを実装
4. 結果出力機能を実装

---

作成日: 2025-12-19



