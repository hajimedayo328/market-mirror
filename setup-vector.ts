import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * pgvector拡張機能のセットアップスクリプト
 */
async function setupVectorDB() {
  console.log('🚀 VectorDBセットアップを開始します...\n');

  try {
    // 1. pgvector拡張を有効化
    console.log('📦 Step 1: pgvector拡張を有効化...');
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log('✅ pgvector拡張が有効化されました\n');

    // 2. embeddingカラムの確認
    console.log('🔍 Step 2: embeddingカラムを確認...');
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ideas' AND column_name = 'embedding'
    `;

    if (result.length === 0) {
      console.log('⚠️  embeddingカラムが見つかりません');
      console.log('   マイグレーションを実行してください: npx prisma migrate dev\n');
    } else {
      console.log('✅ embeddingカラムが存在します\n');
    }

    // 3. インデックスを作成（パフォーマンス向上）
    console.log('📊 Step 3: ベクトル検索用インデックスを作成...');
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS ideas_embedding_idx 
        ON ideas 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `;
      console.log('✅ インデックスが作成されました\n');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  インデックスは既に存在します\n');
      } else {
        console.warn('⚠️  インデックス作成をスキップしました（データが少ない場合は正常）\n');
      }
    }

    // 4. 既存アイデアの数を確認
    console.log('📈 Step 4: 既存データを確認...');
    const totalIdeas = await prisma.idea.count();
    const ideasWithEmbedding = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM ideas WHERE embedding IS NOT NULL
    `;
    const embeddingCount = Number(ideasWithEmbedding[0].count);

    console.log(`   総アイデア数: ${totalIdeas}`);
    console.log(`   埋め込み済み: ${embeddingCount}`);
    console.log(`   未処理: ${totalIdeas - embeddingCount}\n`);

    if (totalIdeas - embeddingCount > 0) {
      console.log('💡 未処理のアイデアがあります');
      console.log('   以下のコマンドで埋め込みを生成できます:');
      console.log('   npm run vector:generate\n');
    }

    console.log('✨ セットアップ完了！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupVectorDB();

