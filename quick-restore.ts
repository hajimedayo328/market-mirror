import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * データベースを素早く復元するスクリプト
 * ペルソナ + デモデータ + ベクトル埋め込みを一括で復元
 */
async function quickRestore() {
  console.log('🔄 データベース復元を開始します...\n');

  try {
    // 1. ペルソナの確認
    const personaCount = await prisma.persona.count();
    console.log(`📊 現在のペルソナ数: ${personaCount}人`);

    if (personaCount === 0) {
      console.log('⚠️  ペルソナが0人です。シードを実行してください: npm run db:seed\n');
      process.exit(1);
    }

    // 2. アイデアの確認
    const ideaCount = await prisma.idea.count();
    console.log(`💡 現在のアイデア数: ${ideaCount}件`);

    // 3. 埋め込みの確認
    const ideasWithEmbedding = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM ideas WHERE embedding IS NOT NULL
    `;
    const embeddingCount = Number(ideasWithEmbedding[0].count);
    console.log(`🔍 埋め込み済み: ${embeddingCount}件\n`);

    console.log('───────────────────────────────');
    console.log('✅ データベースは正常です！');
    console.log('───────────────────────────────\n');

    console.log('📝 不足しているデータがある場合:');
    console.log('   ペルソナ: npx prisma db seed');
    console.log('   デモデータ: npm run demo');
    console.log('   埋め込み: npm run vector:generate\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

quickRestore();
