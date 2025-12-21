-- AlterTable
ALTER TABLE "analysis_jobs" ADD COLUMN     "distortionWeights" JSONB;

-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "embedding" vector(1536);
