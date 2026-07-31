-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('requester', 'reviewer', 'sap_specialist', 'business_analyst', 'uat_tester', 'admin');

-- CreateEnum
CREATE TYPE "ConfigStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('CREATE', 'UPDATE', 'EXTEND');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PROCESSING', 'NEEDS_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'READY_FOR_SAP', 'SYNCING', 'SYNCED', 'SYNC_FAILED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SYNCED', 'SYNC_FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'MODIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DuplicateResolution" AS ENUM ('PENDING', 'NOT_DUPLICATE', 'LINKED', 'MERGED', 'REPLACED', 'CANCELLED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "SapJobStatus" AS ENUM ('QUEUED', 'VALIDATING', 'SYNCING', 'SUCCEEDED', 'FAILED_RETRYABLE', 'FAILED_PERMANENT', 'DEAD_LETTER', 'CANCELLED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ConfigStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "externalIdentityId" TEXT,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrganizationRole" (
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOrganizationRole_pkey" PRIMARY KEY ("userId","organizationId","role")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ConfigStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "unitFamily" TEXT,
    "allowedUnits" JSONB NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "validationSchema" JSONB NOT NULL,
    "aliases" JSONB NOT NULL,
    "sapField" TEXT,
    "status" "ConfigStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequest" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "type" "RequestType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "RequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "requesterId" UUID NOT NULL,
    "assigneeId" UUID,
    "materialId" UUID,
    "categoryId" UUID,
    "processingProgress" INTEGER NOT NULL DEFAULT 0,
    "processingStage" TEXT,
    "submittedAt" TIMESTAMPTZ(3),
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "approvedAt" TIMESTAMPTZ(3),
    "syncedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MaterialRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "internalCode" TEXT NOT NULL,
    "sapProductId" TEXT,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,
    "categoryId" UUID NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "manufacturerPartNumber" TEXT,
    "gtin" TEXT,
    "baseUnit" TEXT NOT NULL,
    "status" "MaterialStatus" NOT NULL DEFAULT 'DRAFT',
    "completenessScore" DECIMAL(5,4) NOT NULL,
    "confidenceScore" DECIMAL(5,4) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialAttributeValue" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "attributeDefinitionId" UUID NOT NULL,
    "valueJson" JSONB NOT NULL,
    "normalizedValueJson" JSONB NOT NULL,
    "unit" TEXT,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" DECIMAL(5,4),
    "evidenceId" UUID,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MaterialAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "sanitizedFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "pageCount" INTEGER,
    "language" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentExtraction" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerVersion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,
    "rawStoragePath" TEXT,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "DocumentExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRun" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "deployment" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "tokensInput" INTEGER,
    "tokensOutput" INTEGER,
    "latencyMs" INTEGER NOT NULL,
    "costEstimate" DECIMAL(12,6),
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "error" TEXT,

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "page" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "boundingRegions" JSONB NOT NULL,
    "offsetStart" INTEGER,
    "offsetEnd" INTEGER,
    "sourceType" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" UUID NOT NULL,
    "aiRunId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "attributeDefinitionId" UUID,
    "suggestionType" TEXT NOT NULL,
    "originalValueJson" JSONB NOT NULL,
    "suggestedValueJson" JSONB NOT NULL,
    "normalizedValueJson" JSONB NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "reasoningSummary" TEXT NOT NULL,
    "evidenceId" UUID,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateCase" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "sourceMaterialId" UUID NOT NULL,
    "candidateMaterialId" UUID NOT NULL,
    "score" DECIMAL(5,4) NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "resolution" "DuplicateResolution" NOT NULL DEFAULT 'PENDING',
    "resolvedBy" UUID,
    "resolvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "definitionVersion" INTEGER NOT NULL,
    "state" "RequestStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" UUID NOT NULL,
    "workflowInstanceId" UUID NOT NULL,
    "fromState" "RequestStatus",
    "toState" "RequestStatus" NOT NULL,
    "actorId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SapSyncJob" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "operation" TEXT NOT NULL,
    "adapter" TEXT NOT NULL,
    "status" "SapJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" TIMESTAMPTZ(3),
    "requestPayloadPath" TEXT NOT NULL,
    "responsePayloadPath" TEXT,
    "sapProductId" TEXT,
    "httpStatus" INTEGER,
    "errorCode" TEXT,
    "errorCategory" TEXT,
    "errorMessage" TEXT,
    "correlationId" TEXT NOT NULL,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SapSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" UUID,
    "actorRole" "Role" NOT NULL,
    "organizationId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB NOT NULL,
    "correlationId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "UatRelease" (
    "id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UatRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UatScenario" (
    "id" UUID NOT NULL,
    "releaseId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "priority" TEXT NOT NULL,

    CONSTRAINT "UatScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UatExecution" (
    "id" UUID NOT NULL,
    "releaseId" UUID NOT NULL,
    "scenarioId" UUID NOT NULL,
    "testerId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "evidence" JSONB NOT NULL,
    "signedOffAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UatExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_status_createdAt_idx" ON "Organization"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_externalIdentityId_key" ON "User"("externalIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");

-- CreateIndex
CREATE INDEX "UserOrganizationRole_organizationId_role_idx" ON "UserOrganizationRole"("organizationId", "role");

-- CreateIndex
CREATE INDEX "Category_organizationId_status_idx" ON "Category"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Category_organizationId_slug_version_key" ON "Category"("organizationId", "slug", "version");

-- CreateIndex
CREATE INDEX "AttributeDefinition_categoryId_status_order_idx" ON "AttributeDefinition"("categoryId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_categoryId_code_version_key" ON "AttributeDefinition"("categoryId", "code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRequest_materialId_key" ON "MaterialRequest"("materialId");

-- CreateIndex
CREATE INDEX "MaterialRequest_organizationId_status_createdAt_idx" ON "MaterialRequest"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MaterialRequest_requesterId_status_idx" ON "MaterialRequest"("requesterId", "status");

-- CreateIndex
CREATE INDEX "MaterialRequest_assigneeId_status_idx" ON "MaterialRequest"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "Material_organizationId_status_updatedAt_idx" ON "Material"("organizationId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Material_categoryId_status_idx" ON "Material"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Material_manufacturer_manufacturerPartNumber_idx" ON "Material"("manufacturer", "manufacturerPartNumber");

-- CreateIndex
CREATE INDEX "Material_gtin_idx" ON "Material"("gtin");

-- CreateIndex
CREATE UNIQUE INDEX "Material_organizationId_internalCode_key" ON "Material"("organizationId", "internalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Material_organizationId_sapProductId_key" ON "Material"("organizationId", "sapProductId");

-- CreateIndex
CREATE INDEX "MaterialAttributeValue_materialId_status_idx" ON "MaterialAttributeValue"("materialId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialAttributeValue_materialId_attributeDefinitionId_key" ON "MaterialAttributeValue"("materialId", "attributeDefinitionId");

-- CreateIndex
CREATE INDEX "Document_organizationId_sha256_idx" ON "Document"("organizationId", "sha256");

-- CreateIndex
CREATE INDEX "Document_requestId_status_idx" ON "Document"("requestId", "status");

-- CreateIndex
CREATE INDEX "DocumentExtraction_documentId_status_idx" ON "DocumentExtraction"("documentId", "status");

-- CreateIndex
CREATE INDEX "AiRun_requestId_status_idx" ON "AiRun"("requestId", "status");

-- CreateIndex
CREATE INDEX "Evidence_documentId_page_idx" ON "Evidence"("documentId", "page");

-- CreateIndex
CREATE INDEX "AiSuggestion_materialId_status_idx" ON "AiSuggestion"("materialId", "status");

-- CreateIndex
CREATE INDEX "AiSuggestion_aiRunId_idx" ON "AiSuggestion"("aiRunId");

-- CreateIndex
CREATE INDEX "DuplicateCase_organizationId_status_createdAt_idx" ON "DuplicateCase"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateCase_sourceMaterialId_candidateMaterialId_key" ON "DuplicateCase"("sourceMaterialId", "candidateMaterialId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_state_updatedAt_idx" ON "WorkflowInstance"("state", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowInstance_entityType_entityId_key" ON "WorkflowInstance"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_workflowInstanceId_createdAt_idx" ON "WorkflowTransition"("workflowInstanceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SapSyncJob_correlationId_key" ON "SapSyncJob"("correlationId");

-- CreateIndex
CREATE INDEX "SapSyncJob_status_nextAttemptAt_idx" ON "SapSyncJob"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "SapSyncJob_materialId_createdAt_idx" ON "SapSyncJob"("materialId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_timestamp_idx" ON "AuditEvent"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_entity_entityId_timestamp_idx" ON "AuditEvent"("entity", "entityId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_correlationId_idx" ON "AuditEvent"("correlationId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "FeatureFlag_environment_enabled_idx" ON "FeatureFlag"("environment", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "UatRelease_version_key" ON "UatRelease"("version");

-- CreateIndex
CREATE UNIQUE INDEX "UatScenario_releaseId_code_key" ON "UatScenario"("releaseId", "code");

-- CreateIndex
CREATE INDEX "UatExecution_releaseId_status_idx" ON "UatExecution"("releaseId", "status");

-- CreateIndex
CREATE INDEX "UatExecution_testerId_status_idx" ON "UatExecution"("testerId", "status");

-- AddForeignKey
ALTER TABLE "UserOrganizationRole" ADD CONSTRAINT "UserOrganizationRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganizationRole" ADD CONSTRAINT "UserOrganizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAttributeValue" ADD CONSTRAINT "MaterialAttributeValue_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAttributeValue" ADD CONSTRAINT "MaterialAttributeValue_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAttributeValue" ADD CONSTRAINT "MaterialAttributeValue_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaterialRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentExtraction" ADD CONSTRAINT "DocumentExtraction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaterialRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_aiRunId_fkey" FOREIGN KEY ("aiRunId") REFERENCES "AiRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateCase" ADD CONSTRAINT "DuplicateCase_sourceMaterialId_fkey" FOREIGN KEY ("sourceMaterialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateCase" ADD CONSTRAINT "DuplicateCase_candidateMaterialId_fkey" FOREIGN KEY ("candidateMaterialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SapSyncJob" ADD CONSTRAINT "SapSyncJob_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaterialRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SapSyncJob" ADD CONSTRAINT "SapSyncJob_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UatScenario" ADD CONSTRAINT "UatScenario_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "UatRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UatExecution" ADD CONSTRAINT "UatExecution_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "UatRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UatExecution" ADD CONSTRAINT "UatExecution_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "UatScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
