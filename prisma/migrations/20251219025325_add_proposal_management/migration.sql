-- CreateTable
CREATE TABLE "proposals" (
    "id" SERIAL NOT NULL,
    "sourceIdeaId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "targetAudience" VARCHAR(500) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "adoptedAsIdeaId" INTEGER,
    "aiReasoning" TEXT,
    "estimatedScore" DECIMAL(3,1),
    "selectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adoptedAt" TIMESTAMP(3),

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposals_sourceIdeaId_idx" ON "proposals"("sourceIdeaId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_sourceIdeaId_fkey" FOREIGN KEY ("sourceIdeaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_adoptedAsIdeaId_fkey" FOREIGN KEY ("adoptedAsIdeaId") REFERENCES "ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
