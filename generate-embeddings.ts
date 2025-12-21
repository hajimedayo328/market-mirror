import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding, generateIdeaText } from './market-mirror/lib/embeddings';

const prisma = new PrismaClient();

/**
 * 全アイデアの埋め込みを生成するスクリプト
 */
async function generateAllEmbeddings() {
  console.log('🚀 埋め込み生成を開始します...\n');

  try {
    // 埋め込みが未生成のアイデアを取得
    const ideas = await prisma.$queryRaw<Array<{
      id: number;
      title: string;
      description: string;
    }>>`
      SELECT id, title, description 
      FROM ideas 
      WHERE embedding IS NULL
    `;

    if (ideas.length === 0) {
      console.log('✅ すべてのアイデアに埋め込みが生成済みです\n');
      return;
    }

    console.log(`📝 ${ideas.length}件のアイデアを処理します...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i];
      const progress = `[${i + 1}/${ideas.length}]`;

      try {
        console.log(`${progress} Processing: ${idea.title}`);

        // テキストから埋め込みを生成
        const text = generateIdeaText(idea);
        const embedding = await generateEmbedding(text);

        // PostgreSQLのvector型に保存
        await prisma.$executeRaw`
          UPDATE ideas 
          SET embedding = ${JSON.stringify(embedding)}::vector 
          WHERE id = ${idea.id}
        `;

        successCount++;
        console.log(`${progress} ✅ 完了 (${idea.id})\n`);
      } catch (error) {
        errorCount++;
        console.error(`${progress} ❌ エラー (${idea.id}):`, error);
        console.log('');
      }
    }

    console.log('───────────────────────────────');
    console.log('📊 結果:');
    console.log(`   成功: ${successCount}件`);
    console.log(`   失敗: ${errorCount}件`);
    console.log(`   合計: ${ideas.length}件`);
    console.log('───────────────────────────────\n');

    if (successCount > 0) {
      console.log('✨ 埋め込み生成が完了しました！');
      console.log('   レポートページで「類似アイデア」セクションを確認できます。\n');
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

generateAllEmbeddings();

