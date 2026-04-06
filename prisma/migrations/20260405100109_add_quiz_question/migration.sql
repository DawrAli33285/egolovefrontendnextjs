-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" SERIAL NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'FR',
    "persona" TEXT NOT NULL DEFAULT 'All',
    "pilier_id" INTEGER NOT NULL,
    "pilier_emoji" TEXT,
    "pilier_nom" TEXT NOT NULL,
    "poids_pilier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "pilier_description" TEXT,
    "question_id" TEXT NOT NULL,
    "correspondance_label" TEXT,
    "correspondance_description" TEXT,
    "question" TEXT NOT NULL,
    "poids_question" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "reponse_a" TEXT NOT NULL,
    "reponse_b" TEXT NOT NULL,
    "reponse_c" TEXT NOT NULL,
    "reponse_d" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_question_id_key" ON "quiz_questions"("question_id");

-- CreateIndex
CREATE INDEX "quiz_questions_pilier_id_idx" ON "quiz_questions"("pilier_id");

-- CreateIndex
CREATE INDEX "quiz_questions_langue_persona_idx" ON "quiz_questions"("langue", "persona");
