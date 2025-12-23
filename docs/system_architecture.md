# システム構成図

## 概要
Market Mirrorアプリケーションのシステム構成をMermaid.js形式で表現した図です。

## システム構成図

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser<br/>Next.js App]
    end
    
    subgraph "Application Layer"
        NextJS[Next.js 16<br/>App Router]
        ServerActions[Server Actions<br/>CRUD Operations]
        APIRoutes[API Routes<br/>/api/worker, /api/jobs]
    end
    
    subgraph "Business Logic Layer"
        Worker[Worker Process<br/>非同期処理キュー]
        AIService[AI Service Layer]
        OpenAI[OpenAI API<br/>GPT-4]
        Gemini[Gemini API]
        GoogleSlides[Google Slides API<br/>スライド生成]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        PostgreSQL[(PostgreSQL<br/>Docker Container)]
        VectorDB[(pgvector<br/>埋め込みベクトル)]
    end
    
    subgraph "External Services"
        Docker[Docker Compose<br/>データベース管理]
    end
    
    Browser -->|HTTP/HTTPS| NextJS
    NextJS --> ServerActions
    NextJS --> APIRoutes
    ServerActions --> Prisma
    APIRoutes --> Worker
    Worker --> AIService
    AIService --> OpenAI
    AIService --> Gemini
    Worker --> GoogleSlides
    Prisma --> PostgreSQL
    PostgreSQL --> VectorDB
    Docker --> PostgreSQL
    
    style Browser fill:#e1f5ff
    style NextJS fill:#c8e6c9
    style ServerActions fill:#c8e6c9
    style APIRoutes fill:#c8e6c9
    style Worker fill:#fff9c4
    style AIService fill:#fff9c4
    style OpenAI fill:#ffccbc
    style Gemini fill:#ffccbc
    style GoogleSlides fill:#ffccbc
    style Prisma fill:#b39ddb
    style PostgreSQL fill:#b39ddb
    style VectorDB fill:#b39ddb
    style Docker fill:#f8bbd0
```

## データフロー図

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant NextJS as Next.js App
    participant DB as PostgreSQL
    participant Worker as Worker Process
    participant AI as AI API
    participant Slides as Google Slides

    User->>NextJS: アイデア投稿
    NextJS->>DB: Idea作成
    NextJS->>DB: AnalysisJob作成(PENDING)
    NextJS-->>User: ジョブID返却
    
    NextJS->>Worker: ジョブ処理開始
    Worker->>DB: ジョブ取得(PENDING→PROCESSING)
    
    loop 90人のペルソナ評価
        Worker->>AI: ペルソナ評価リクエスト
        AI-->>Worker: 評価結果
        Worker->>DB: Review保存
        Worker->>DB: プログレス更新
    end
    
    Worker->>DB: ジョブ完了(COMPLETED)
    NextJS->>DB: レビュー取得
    NextJS-->>User: レポート表示
    
    User->>NextJS: スライド生成リクエスト
    NextJS->>Slides: スライド作成
    Slides-->>NextJS: スライドURL
    NextJS-->>User: スライド表示
```

## コンポーネント詳細

### 1. Client Layer（クライアント層）
- **Web Browser**: ユーザーインターフェース
- **Next.js App**: ReactベースのSPA

### 2. Application Layer（アプリケーション層）
- **Next.js 16 (App Router)**: フロントエンドとバックエンドを統合
- **Server Actions**: サーバーサイドのCRUD操作
- **API Routes**: 非同期処理のためのエンドポイント

### 3. Business Logic Layer（ビジネスロジック層）
- **Worker Process**: 非同期ジョブキュー処理
  - PostgreSQLをキューとして使用
  - 排他制御による安全な処理
  - 90人のペルソナ評価を順次実行
- **AI Service Layer**: AI API呼び出しの抽象化
  - OpenAI API (GPT-4)
  - Gemini API
- **Google Slides API**: レポートのスライド生成

### 4. Data Layer（データ層）
- **Prisma ORM**: 型安全なデータベースアクセス
- **PostgreSQL**: リレーショナルデータベース
  - Dockerコンテナで実行
  - トランザクション管理
- **pgvector**: ベクトル埋め込みの保存
  - アイデアの類似度検索に使用

### 5. External Services（外部サービス）
- **Docker Compose**: データベースの管理と起動

## 非同期処理フロー

### Job Queue Architecture
1. **ジョブ作成**: ユーザーがアイデアを投稿すると、`AnalysisJob`が`PENDING`状態で作成される
2. **Worker起動**: `/api/worker/process-queue`エンドポイントが呼び出される
3. **排他制御**: トランザクション内でジョブを`PROCESSING`に更新（他のWorkerが取得できないように）
4. **順次処理**: 90人のペルソナに対して順次AI評価を実行
5. **プログレス更新**: 各評価完了時に`currentStep`を更新
6. **完了処理**: 全評価完了後、ジョブを`COMPLETED`に更新

### エラーハンドリング
- **ゾンビジョブ防止**: タイムアウト処理で長時間`PROCESSING`のジョブを`FAILED`に変更
- **リトライ機能**: 失敗したジョブを再実行可能
- **エラーログ**: 詳細なエラー情報を`error`フィールドに保存

## 技術スタック

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

### Backend
- Next.js Server Actions
- Next.js API Routes
- Prisma ORM

### Database
- PostgreSQL 15+
- pgvector (ベクトル検索)

### External APIs
- OpenAI API (GPT-4)
- Google Gemini API
- Google Slides API

### Infrastructure
- Docker & Docker Compose
- Node.js 18+
