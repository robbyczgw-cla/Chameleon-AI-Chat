-- Update memory_settings documentation to include new maintenance fields
-- NOTE: This migration is OPTIONAL - JSONB columns already support these fields
-- This script only updates documentation/comments

-- Update comment to document new maintenance settings
COMMENT ON COLUMN public.user_settings.memory_settings IS
'Memory System configuration:
- Core: enabled, autoExtract, maxMemoriesInContext, importanceThreshold
- Semantic search: useSemanticSearch, similarityThreshold
- Intelligent retrieval: classificationConfidence, minRelevanceScore, alwaysRetrieveForPersonas
- Expiration: expirationEnabled, expirationDays, archiveRetentionDays
- Automatic maintenance: autoConsolidation, autoImportanceAdjustment, lastMaintenanceRun';

-- Update experimental_settings comment to document memoryConsolidation model
COMMENT ON COLUMN public.user_settings.experimental_settings IS
'Stores experimental feature settings as JSON:
- Features: enableResponseAnalysis, performanceMode, streamingVisualization, etc.
- Background AI Models: titleGeneration, memoryExtraction, memoryConsolidation, queryClassification, promptHelper, personaGeneration, personalityAnalysis, conversationInsights, contextCompression, imageGenNormal, imageGenHigh, embeddings';

-- No schema changes needed - JSONB columns accept new fields automatically
-- The following fields are now supported (all optional):
--
-- memory_settings:
--   autoConsolidation: boolean (default: false) - Auto-merge duplicate memories daily
--   autoImportanceAdjustment: boolean (default: true) - Auto-adjust importance based on usage
--   lastMaintenanceRun: number - Timestamp of last maintenance run
--
-- experimental_settings.backgroundAIModels:
--   memoryConsolidation: string (default: "openai/gpt-oss-120b") - Model for consolidation
