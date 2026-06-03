-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('root', 'branch', 'summary', 'note');

-- CreateEnum
CREATE TYPE "NodeRole" AS ENUM ('assistant', 'mixed');

-- CreateEnum
CREATE TYPE "EdgeType" AS ENUM ('span_question', 'expands', 'summarizes');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "role" "NodeRole" NOT NULL DEFAULT 'mixed',
    "content" TEXT NOT NULL,
    "question" TEXT,
    "selectedText" TEXT,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parentNodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edges" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "type" "EdgeType" NOT NULL DEFAULT 'span_question',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anchors" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "selectedText" TEXT NOT NULL,
    "startOffset" INTEGER,
    "endOffset" INTEGER,
    "prefixText" TEXT,
    "suffixText" TEXT,
    "surroundingContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anchors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nodes_conversationId_idx" ON "nodes"("conversationId");

-- CreateIndex
CREATE INDEX "nodes_parentNodeId_idx" ON "nodes"("parentNodeId");

-- CreateIndex
CREATE INDEX "edges_conversationId_idx" ON "edges"("conversationId");

-- CreateIndex
CREATE INDEX "edges_sourceNodeId_idx" ON "edges"("sourceNodeId");

-- CreateIndex
CREATE INDEX "edges_targetNodeId_idx" ON "edges"("targetNodeId");

-- CreateIndex
CREATE INDEX "anchors_conversationId_idx" ON "anchors"("conversationId");

-- CreateIndex
CREATE INDEX "anchors_sourceNodeId_idx" ON "anchors"("sourceNodeId");

-- CreateIndex
CREATE INDEX "anchors_targetNodeId_idx" ON "anchors"("targetNodeId");

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anchors" ADD CONSTRAINT "anchors_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anchors" ADD CONSTRAINT "anchors_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anchors" ADD CONSTRAINT "anchors_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
