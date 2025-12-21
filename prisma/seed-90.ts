import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 90人のペルソナ（各カテゴリ30人ずつ）を生成
 */
async function main() {
  console.log('🌱 90人のペルソナを投入開始...');

  // 既存のデータをクリア（順序重要：外部キー制約のため）
  console.log('🗑️  既存のレビューを削除中...');
  await prisma.review.deleteMany();
  
  console.log('🗑️  既存のペルソナを削除中...');
  await prisma.persona.deleteMany();

  // PostgreSQLのシーケンスをリセット（IDを1から始める）
  console.log('🔄 IDシーケンスをリセット中...');
  await prisma.$executeRaw`ALTER SEQUENCE personas_id_seq RESTART WITH 1;`;

  const personas: any[] = [];

  // ===== Standard_Japan: 30人 =====
  const standardJapanBase = [
    { name: '田中 太郎', age: 22, occupation: '大学生', income: 500000, personality: '好奇心旺盛', hobbies: 'ゲーム' },
    { name: '佐藤 花子', age: 28, occupation: '会社員（事務）', income: 3800000, personality: '真面目で計画的', hobbies: 'ヨガ' },
    { name: '鈴木 健一', age: 35, occupation: '営業職', income: 5200000, personality: '社交的', hobbies: 'ゴルフ' },
    { name: '山田 美咲', age: 32, occupation: '主婦（パート）', income: 1200000, personality: '節約上手', hobbies: '料理' },
    { name: '高橋 一郎', age: 45, occupation: '管理職', income: 7500000, personality: '責任感強い', hobbies: '読書' },
    { name: '伊藤 真由美', age: 52, occupation: '看護師', income: 5000000, personality: '優しい', hobbies: '温泉' },
    { name: '渡辺 誠', age: 62, occupation: '定年退職者', income: 3000000, personality: '穏やか', hobbies: '釣り' },
    { name: '中村 恵子', age: 68, occupation: '年金生活者', income: 2000000, personality: '健康的', hobbies: 'ダンス' },
    { name: '小林 拓也', age: 19, occupation: 'フリーター', income: 1800000, personality: 'マイペース', hobbies: 'バンド' },
    { name: '吉田 あゆみ', age: 40, occupation: 'パート（小売）', income: 2400000, personality: '明るい', hobbies: '美容' },
    { name: '前田 聡', age: 23, occupation: '専門学校生', income: 800000, personality: '真面目', hobbies: '映画' },
    { name: '岡田 結衣', age: 24, occupation: '美容師', income: 3000000, personality: 'おしゃれ', hobbies: 'インスタ' },
    { name: '藤田 健', age: 31, occupation: '銀行員', income: 5500000, personality: '堅実', hobbies: '投資' },
    { name: '井上 麻衣', age: 29, occupation: '保育士', income: 3200000, personality: '子供好き', hobbies: 'ピアノ' },
    { name: '木下 龍一', age: 36, occupation: '警察官', income: 6500000, personality: '正義感強い', hobbies: '武道' },
    { name: '松井 優子', age: 37, occupation: '歯科衛生士', income: 4000000, personality: '几帳面', hobbies: 'ヨガ' },
    { name: '森 誠', age: 43, occupation: '不動産営業', income: 7000000, personality: '話し上手', hobbies: 'ゴルフ' },
    { name: '石川 千春', age: 41, occupation: 'ピアノ講師', income: 3500000, personality: '芸術的', hobbies: '音楽' },
    { name: '清水 大輔', age: 47, occupation: '工場長', income: 8000000, personality: '現場主義', hobbies: '野球' },
    { name: '橋本 真奈美', age: 49, occupation: '学校事務', income: 3800000, personality: '気配り上手', hobbies: '園芸' },
    { name: '長谷川 修', age: 51, occupation: 'タクシー運転手', income: 4200000, personality: '話好き', hobbies: 'パチンコ' },
    { name: '村上 律子', age: 54, occupation: '介護士', income: 3600000, personality: '献身的', hobbies: 'ドラマ' },
    { name: '阿部 孝', age: 56, occupation: '地方公務員', income: 6800000, personality: '地域貢献意識', hobbies: '地域活動' },
    { name: '吉川 久美子', age: 59, occupation: 'パート（スーパー）', income: 1800000, personality: '世話好き', hobbies: '井戸端会議' },
    { name: '今井 太一', age: 63, occupation: '再雇用', income: 3500000, personality: 'ベテラン', hobbies: '盆栽' },
    { name: '遠藤 幸子', age: 65, occupation: '年金生活者', income: 2200000, personality: '社交的', hobbies: '習い事' },
    { name: '佐野 義明', age: 70, occupation: '完全退職者', income: 2500000, personality: '知的', hobbies: '囲碁' },
    { name: '池田 和子', age: 67, occupation: '年金生活者', income: 1800000, personality: '節約家', hobbies: '手芸' },
    { name: '三浦 雄二', age: 20, occupation: '専門学校生', income: 600000, personality: '技術志向', hobbies: 'プログラミング' },
    { name: '野口 奈々', age: 21, occupation: 'アルバイト', income: 1500000, personality: '夢追い人', hobbies: 'ダンス' },
  ];

  for (let i = 0; i < standardJapanBase.length; i++) {
    const base = standardJapanBase[i];
    personas.push({
      name: base.name,
      age: base.age,
      gender: i % 2 === 0 ? '男性' : '女性',
      occupation: base.occupation,
      annualIncome: base.income,
      personality: base.personality,
      hobbies: base.hobbies,
      challenges: `${base.occupation}としての課題`,
      buyingBehavior: `${base.personality}な購入傾向`,
      category: 'Standard_Japan',
    });
  }

  // ===== Inbound_Tourist: 30人 =====
  const touristNames = [
    'Emily Johnson', 'David Chen', 'Sophie Martin', 'Michael Brown', 'Li Wei',
    'Anna Schmidt', 'James Wilson', 'Maria Garcia', 'Ryan Kim', 'Isabella Rossi',
    'Tom Anderson', 'Sarah Lee', 'Peter Zhang', 'Linda Wang', 'Carlos Silva',
    'Emma White', 'Hans Mueller', 'Olivia Taylor', 'Alexandre Dubois', 'Jessica Park',
    'Ahmed Hassan', 'Rachel Cohen', 'Marco Bianchi', 'Chloe Thompson', 'Lucas Santos',
    'Nina Petrov', 'Kevin O\'Brien', 'Yuki Tanaka', 'Robert Miller', 'Sophia Nguyen',
  ];

  for (let i = 0; i < 30; i++) {
    personas.push({
      name: touristNames[i],
      age: 22 + (i * 2),
      gender: i % 2 === 0 ? '女性' : '男性',
      occupation: '訪日観光客',
      annualIncome: 5000000 + (i * 500000),
      personality: '旅行好きで冒険的',
      hobbies: '観光、写真、グルメ',
      challenges: '短期間で日本を満喫したい',
      buyingBehavior: '体験型消費とお土産購入',
      category: 'Inbound_Tourist',
    });
  }

  // ===== Biz_Tech: 30人 =====
  const bizTechBase = [
    { name: '山本 裕太', age: 29, occupation: 'スタートアップCEO', income: 15000000 },
    { name: '加藤 真理子', age: 32, occupation: 'フルスタックエンジニア', income: 9000000 },
    { name: '佐々木 健太', age: 35, occupation: 'VC投資家', income: 20000000 },
    { name: '西村 あかり', age: 27, occupation: 'UXデザイナー', income: 7000000 },
    { name: '田村 大輔', age: 41, occupation: 'CTO', income: 18000000 },
    { name: '森田 春菜', age: 30, occupation: 'PM', income: 8500000 },
    { name: '石井 翔', age: 25, occupation: 'AIエンジニア', income: 10000000 },
    { name: '岡本 みゆき', age: 38, occupation: 'グロースハッカー', income: 11000000 },
    { name: '青木 拓海', age: 33, occupation: 'ブロックチェーンエンジニア', income: 13000000 },
    { name: '橋本 沙織', age: 28, occupation: 'DevOpsエンジニア', income: 8000000 },
    { name: '中野 隼人', age: 26, occupation: 'データサイエンティスト', income: 8500000 },
    { name: '藤原 梨花', age: 31, occupation: 'SaaSマーケター', income: 7500000 },
    { name: '大塚 剛', age: 44, occupation: 'セキュリティエンジニア', income: 12000000 },
    { name: '平野 瞳', age: 29, occupation: 'スクラムマスター', income: 7000000 },
    { name: '小川 悠太', age: 27, occupation: 'モバイルアプリ開発者', income: 7500000 },
    { name: '安藤 真紀', age: 34, occupation: 'HRテック創業者', income: 10000000 },
    { name: '内田 勇気', age: 36, occupation: 'クラウドアーキテクト', income: 11500000 },
    { name: '斉藤 彩', age: 30, occupation: 'カスタマーサクセス', income: 6500000 },
    { name: '水野 健', age: 39, occupation: 'SREエンジニア', income: 10500000 },
    { name: '吉岡 美穂', age: 28, occupation: 'コンテンツマーケター', income: 6800000 },
    { name: '谷口 翔太', age: 42, occupation: 'CFO', income: 16000000 },
    { name: '永井 さやか', age: 26, occupation: 'QAエンジニア', income: 6000000 },
    { name: '島田 大樹', age: 37, occupation: 'AIコンサルタント', income: 14000000 },
    { name: '北川 愛', age: 33, occupation: 'UXリサーチャー', income: 7800000 },
    { name: '飯田 啓介', age: 40, occupation: 'テックリード', income: 13500000 },
    // 追加5人
    { name: '坂本 健吾', age: 34, occupation: 'バックエンドエンジニア', income: 9500000 },
    { name: '松田 理沙', age: 31, occupation: 'フロントエンドエンジニア', income: 8200000 },
    { name: '福田 誠一', age: 43, occupation: 'VPoE', income: 17000000 },
    { name: '井川 あすか', age: 29, occupation: 'テクニカルライター', income: 6500000 },
    { name: '杉本 竜也', age: 35, occupation: 'SaaS営業', income: 9000000 },
  ];

  for (let i = 0; i < bizTechBase.length; i++) {
    const base = bizTechBase[i];
    personas.push({
      name: base.name,
      age: base.age,
      gender: i % 2 === 0 ? '男性' : '女性',
      occupation: base.occupation,
      annualIncome: base.income,
      personality: `${base.occupation}として活躍中`,
      hobbies: '技術トレンド追跡、ネットワーキング',
      challenges: `${base.occupation}としての成長と成果`,
      buyingBehavior: '効率化ツール、ビジネス書、ガジェット',
      category: 'Biz_Tech',
    });
  }

  // データベースに一括投入
  await prisma.persona.createMany({
    data: personas,
  });

  // カテゴリ別カウント
  const standardCount = personas.filter(p => p.category === 'Standard_Japan').length;
  const touristCount = personas.filter(p => p.category === 'Inbound_Tourist').length;
  const bizTechCount = personas.filter(p => p.category === 'Biz_Tech').length;

  console.log(`✅ ${personas.length}人のペルソナを作成しました！`);
  console.log(`   - Standard_Japan: ${standardCount}人`);
  console.log(`   - Inbound_Tourist: ${touristCount}人`);
  console.log(`   - Biz_Tech: ${bizTechCount}人`);
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
