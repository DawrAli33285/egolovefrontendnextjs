/*
  Warnings:

  - A unique constraint covering the columns `[quizType,question_id,langue]` on the table `quiz_questions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `pilier_emoji` on table `quiz_questions` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "QuizType" AS ENUM ('free', 'premium');

-- DropIndex
DROP INDEX "quiz_questions_langue_persona_idx";

-- DropIndex
DROP INDEX "quiz_questions_pilier_id_idx";

-- DropIndex
DROP INDEX "quiz_questions_question_id_key";

-- AlterTable
ALTER TABLE "quiz_questions" ADD COLUMN     "quizType" "QuizType" NOT NULL DEFAULT 'free',
ALTER COLUMN "pilier_emoji" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_quizType_question_id_langue_key" ON "quiz_questions"("quizType", "question_id", "langue");
