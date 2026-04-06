-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'unactive');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "age" INTEGER,
    "avatar" TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1535615615570-3b839f4359be?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "csp" TEXT,
    "region" TEXT,
    "country" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "price" DOUBLE PRECISION,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "stripe_Subscription_Id" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barometer_results" (
    "id" SERIAL NOT NULL,
    "quizType" TEXT NOT NULL DEFAULT 'free',
    "language" TEXT NOT NULL DEFAULT 'en',
    "answers" INTEGER[],
    "pillarResults" JSONB NOT NULL DEFAULT '[]',
    "globalEgoPercent" DOUBLE PRECISION,
    "globalLovePercent" DOUBLE PRECISION,
    "globalProfile" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barometer_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barometer_results" ADD CONSTRAINT "barometer_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
