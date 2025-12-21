/**
 * 既存のアイデアに対してレビューデータを生成
 * 
 * 実行方法：
 * npx tsx generate-reviews.ts
 * 
 * 内容：
 * 1. 既存のアイデアを取得
 * 2. レビューがないアイデアに対して、90人のペルソナからレビューを生成
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// モックAI評価関数（再現性確保のため固定シード使用）
function mockAIEvaluate(persona: any, idea: any) {
  // 固定シードで再現性を確保
  const seed = parseInt(persona.id.toString() + idea.id.toString());
  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  let baseScore = Math.floor(random(seed) * 5) + 5; // 5-9の範囲
  
  // カテゴリマッチでボーナス
  if (persona.category === idea.category) {
    baseScore += 1;
  }
  
  // 年齢層による調整
  if (persona.age < 30 && idea.title.includes('AI')) {
    baseScore += 1;
  }
  if (persona.age > 50 && (idea.title.includes('シンプル') || idea.title.includes('簡単'))) {
    baseScore += 0.5;
  }
  
  const score = Math.min(10, Math.max(1, Math.round(baseScore)));
  const willBuy = score >= 7 ? random(seed + 1) > 0.3 : random(seed + 1) > 0.7;
  
  const comments = [
    `${idea.title}は${persona.name}（${persona.age}歳・${persona.occupation}）にとって魅力的です。${persona.challenges}の解決に役立ちそうです。`,
    `このアイデアは私のニーズに合っています。${persona.buyingBehavior}を考慮すると、とても良いと思います。`,
    `興味深いコンセプトだと思います。${persona.personality}な私としては、もう少し具体的な説明が欲しいです。`,
    `価格が気になります。${persona.annualIncome}円の年収では、もう少し手頃な価格設定だと嬉しいです。`,
    `${persona.hobbies}が好きな私としては、このアイデアは面白そうです。`,
  ];
  
  const comment = comments[Math.floor(random(seed + 2) * comments.length)];
  
  const suggestions = [
    `ターゲット層を${persona.occupation}向けにもっと明確にすると良いでしょう。`,
    `価格設定を${persona.age}代の予算感に合わせると受け入れられやすいです。`,
    `UIをもっとシンプルにすることをお勧めします。`,
    `${persona.buyingBehavior}を考慮すると、機能の追加が必要かもしれません。`,
  ];
  
  const improvementSuggestion = suggestions[Math.floor(random(seed + 3) * suggestions.length)];
  
  const pricePerceptions = ['安い', '適切', '高い', 'わからない'];
  const pricePerception = pricePerceptions[Math.floor(random(seed + 4) * pricePerceptions.length)];
  
  const trustLevel = Math.floor(random(seed + 5) * 2) + 3; // 3-5
  
  return {
    score,
    willBuy,
    comment,
    improvementSuggestion,
    pricePerception,
    trustLevel,
  };
}

async function main() {
  console.log('🚀 レビューデータ生成を開始します...\n');
  
  // 既存のアイデアを取得
  const ideas = await prisma.idea.findMany({
    orderBy: { createdAt: 'desc' },
  });
  
  if (ideas.length === 0) {
    console.log('❌ アイデアが見つかりませんでした。');
    console.log('   まずアイデアを作成してください。\n');
    return;
  }
  
  console.log(`📝 ${ideas.length}件のアイデアが見つかりました。\n`);
  
  // 各アイデアに対してレビューを生成
  for (const idea of ideas) {
    // 既存のレビュー数を確認
    const existingReviewCount = await prisma.review.count({
      where: { ideaId: idea.id },
    });
    
    if (existingReviewCount > 0) {
      console.log(`⏭️  ${idea.title} (ID: ${idea.id})`);
      console.log(`   既に${existingReviewCount}件のレビューがあります。スキップします。\n`);
      continue;
    }
    
    console.log(`💡 ${idea.title} (ID: ${idea.id})`);
    console.log(`   カテゴリ: ${idea.category || 'Standard_Japan'}`);
    
    // ペルソナを取得（90人）
    const personas = await prisma.persona.findMany({
      where: { category: idea.category || 'Standard_Japan' },
      orderBy: { id: 'asc' },
    });
    
    if (personas.length === 0) {
      console.log(`   ⚠️  カテゴリ「${idea.category}」に対応するペルソナが見つかりませんでした。\n`);
      continue;
    }
    
    console.log(`   👥 ${personas.length}人のペルソナがレビュー中...`);
    
    // バッチ処理でレビューを生成（10人ずつ）
    const batchSize = 10;
    let processed = 0;
    
    for (let i = 0; i < personas.length; i += batchSize) {
      const batch = personas.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (persona) => {
          const evaluation = mockAIEvaluate(persona, idea);
          
          await prisma.review.create({
            data: {
              ideaId: idea.id,
              personaId: persona.id,
              score: evaluation.score,
              willBuy: evaluation.willBuy,
              comment: evaluation.comment,
              improvementSuggestion: evaluation.improvementSuggestion,
              pricePerception: evaluation.pricePerception,
              trustLevel: evaluation.trustLevel,
            },
          });
        })
      );
      
      processed += batch.length;
      process.stdout.write(`   📊 進捗: ${processed}/${personas.length}人\r`);
    }
    
    console.log(`\n   ✅ ${personas.length}件のレビューを生成しました。`);
    
    // 統計情報を計算
    const reviews = await prisma.review.findMany({
      where: { ideaId: idea.id },
    });
    
    const avgScore = (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1);
    const buyCount = reviews.filter((r) => r.willBuy).length;
    const buyRate = ((buyCount / reviews.length) * 100).toFixed(0);
    const avgTrust = (reviews.reduce((sum, r) => sum + (r.trustLevel || 3), 0) / reviews.length).toFixed(1);
    
    console.log(`   📊 統計: 平均${avgScore}点 | 購入意向${buyRate}% (${buyCount}/${reviews.length}人) | 平均信頼度${avgTrust}/5\n`);
  }
  
  console.log('✨ レビュー生成完了！\n');
  console.log('🌐 次のステップ：');
  console.log('  1. ブラウザで http://localhost:3000 を開く');
  console.log('  2. レポートページでレビューデータを確認\n');
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
