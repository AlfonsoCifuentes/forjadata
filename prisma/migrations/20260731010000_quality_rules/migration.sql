-- P2 quality-rule persistence model.
CREATE TABLE "QualityRule" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "categoryId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "expressionJson" JSONB NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ConfigStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "QualityRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QualityResult" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detailsJson" JSONB NOT NULL,
    "evaluatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualityResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QualityRule_organizationId_code_key"
ON "QualityRule"("organizationId", "code");
CREATE INDEX "QualityRule_organizationId_status_categoryId_idx"
ON "QualityRule"("organizationId", "status", "categoryId");
CREATE INDEX "QualityResult_materialId_evaluatedAt_idx"
ON "QualityResult"("materialId", "evaluatedAt");
CREATE INDEX "QualityResult_ruleId_status_idx"
ON "QualityResult"("ruleId", "status");

ALTER TABLE "QualityRule"
ADD CONSTRAINT "QualityRule_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QualityRule"
ADD CONSTRAINT "QualityRule_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QualityResult"
ADD CONSTRAINT "QualityResult_materialId_fkey"
FOREIGN KEY ("materialId") REFERENCES "Material"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QualityResult"
ADD CONSTRAINT "QualityResult_ruleId_fkey"
FOREIGN KEY ("ruleId") REFERENCES "QualityRule"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
