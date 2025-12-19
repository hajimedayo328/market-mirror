/*
  Warnings:

  - Added the required column `category` to the `personas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "personas" ADD COLUMN     "category" VARCHAR(100) NOT NULL;
