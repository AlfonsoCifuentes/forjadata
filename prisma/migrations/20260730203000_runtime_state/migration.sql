-- CreateTable
CREATE TABLE "RuntimeState" (
    "key" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RuntimeState_pkey" PRIMARY KEY ("key")
);
