import { createClient } from "@/lib/supabase/client"
import type { Chat, Folder, Message, AppSettings, ComparisonSession, SystemPrompt, Memory, DeletedMemory, AccessTier, ChatShare, SharedChatData } from "@/types"

export class SupabaseSync {
  private supabase = createClient()

  // ===== Chats =====
  async syncChats(userId: string): Promise<Chat[]> {
    const { data, error } = await this.supabase
      .from("chats")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) throw error
    return data.map(this.mapChatFromDB)
  }

  async createChat(userId: string, chat: Chat): Promise<void> {
    console.log("[v0] supabaseSync.createChat called:", { userId, chatId: chat.id, title: chat.title })

    const { error } = await this.supabase.from("chats").insert({
      id: chat.id, // Use existing UUID from chat object
      user_id: userId,
      folder_id: chat.folderId || null,
      title: chat.title,
      pinned: chat.pinned,
      model: chat.model,
      created_at: new Date(chat.createdAt).toISOString(),
      updated_at: new Date(chat.updatedAt).toISOString(),
    })

    if (error) {
      // Ignore duplicate key errors - chat already exists
      if (error.code === "23505") {
        console.log("[v0] Chat already exists in database, skipping duplicate:", chat.id)
        return
      }
      console.error("[v0] ERROR saving chat to Supabase:", error)
      throw error
    }

    console.log("[v0] Chat saved successfully to Supabase:", chat.id)
  }

  async updateChat(userId: string, chat: Chat): Promise<void> {
    const { error } = await this.supabase
      .from("chats")
      .update({
        folder_id: chat.folderId || null,
        title: chat.title,
        pinned: chat.pinned,
        model: chat.model,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chat.id)
      .eq("user_id", userId)

    if (error) throw error
  }

  async deleteChat(userId: string, chatId: string): Promise<void> {
    const { error } = await this.supabase.from("chats").delete().eq("id", chatId).eq("user_id", userId)

    if (error) throw error
  }

  async deleteAllChats(userId: string): Promise<void> {
    const { error } = await this.supabase.from("chats").delete().eq("user_id", userId)

    if (error) throw error
  }

  // ===== Messages =====
  async syncMessages(chatId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data.map(this.mapMessageFromDB)
  }

  async createMessage(message: Message, chatId: string): Promise<void> {
    console.log("[v0] supabaseSync.createMessage called:", { chatId, messageId: message.id, role: message.role })

    // Get the actual model used from stats (where it's actually stored in the Message type)
    const modelUsed = message.stats?.model || null

    // Warn if assistant message is missing model info (shouldn't happen)
    if (!modelUsed && message.role === "assistant") {
      console.warn("[v0] ⚠️ Assistant message missing model info!", {
        messageId: message.id,
        chatId,
        hasStats: !!message.stats,
      })
    }

    const { error } = await this.supabase.from("messages").insert({
      id: message.id, // Use existing UUID from message object
      chat_id: chatId,
      role: message.role,
      content: message.content,
      model: modelUsed, // Store actual model used, or NULL if unknown (don't lie!)
      created_at: new Date(message.timestamp).toISOString(),
    })

    if (error) {
      console.error("[v0] ERROR saving message to Supabase:", error)
      throw error
    }
    console.log("[v0] Message saved successfully to Supabase:", message.id, "model:", modelUsed)
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabase.from("messages").delete().eq("id", messageId)

    if (error) throw error
  }

  // ===== Folders =====
  async syncFolders(userId: string): Promise<Folder[]> {
    const { data, error } = await this.supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data.map(this.mapFolderFromDB)
  }

  async createFolder(userId: string, folder: Folder): Promise<void> {
    const { error } = await this.supabase.from("folders").insert({
      id: folder.id,
      user_id: userId,
      name: folder.name,
      created_at: new Date(folder.createdAt).toISOString(),
      updated_at: new Date(folder.updatedAt).toISOString(),
    })

    if (error) throw error
  }

  async updateFolder(userId: string, folder: Folder): Promise<void> {
    const { error } = await this.supabase
      .from("folders")
      .update({
        name: folder.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", folder.id)
      .eq("user_id", userId)

    if (error) throw error
  }

  async deleteFolder(userId: string, folderId: string): Promise<void> {
    const { error } = await this.supabase.from("folders").delete().eq("id", folderId).eq("user_id", userId)

    if (error) throw error
  }

  // ===== Settings =====
  async syncSettings(userId: string): Promise<AppSettings | null> {
    try {
      const { data, error } = await this.supabase.from("user_settings").select("*").eq("user_id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("[v0] No settings found, will be created by trigger or app")
          return null
        }
        if (error.code === "PGRST204" || error.code === "PGRST205") {
          console.error("[v0] Database schema error:", error.message)
          return null
        }
        if (error.code === "42501") {
          console.log("[v0] RLS policy issue when loading settings, using defaults")
          return null
        }
        throw error
      }

      return this.mapSettingsFromDB(data)
    } catch (err) {
      console.error("[v0] Error loading settings from Supabase:", err)
      return null
    }
  }

  async saveSettings(userId: string, settings: AppSettings): Promise<void> {
    try {
      // DEBUG: Log API keys being saved
      console.log("[Supabase] Saving API keys:", {
        openRouter: settings.apiKeys?.openRouter ? `***${  settings.apiKeys.openRouter.slice(-4)}` : "empty",
        openAI: settings.apiKeys?.openAI ? `***${  settings.apiKeys.openAI.slice(-4)}` : "empty",
        tavily: settings.apiKeys?.tavily ? `***${  settings.apiKeys.tavily.slice(-4)}` : "empty",
        serper: settings.apiKeys?.serper ? `***${  settings.apiKeys.serper.slice(-4)}` : "empty",
        exa: settings.apiKeys?.exa ? `***${  settings.apiKeys.exa.slice(-4)}` : "empty",
      })

      // DEBUG: Log memory settings being saved
      console.log("[Supabase] Saving memorySettings:", settings.memorySettings)

      // CRITICAL: Get existing settings to preserve API keys if new settings have empty values
      // Use .maybeSingle() to avoid errors if settings don't exist yet
      const { data: existingSettings, error: fetchError } = await this.supabase
        .from("user_settings")
        .select("openrouter_api_key, openai_api_key, tavily_api_key, serper_api_key, exa_api_key")
        .eq("user_id", userId)
        .maybeSingle()

      if (fetchError) {
        console.warn("[Supabase] Failed to fetch existing settings (will create new):", fetchError.message)
      }

      // Prepare API key values - NEVER overwrite existing keys with null/empty/undefined
      const openRouterKey = settings.apiKeys?.openRouter || existingSettings?.openrouter_api_key || null
      const openAIKey = settings.apiKeys?.openAI || existingSettings?.openai_api_key || null
      const tavilyKey = settings.apiKeys?.tavily || existingSettings?.tavily_api_key || null
      const serperKey = settings.apiKeys?.serper || existingSettings?.serper_api_key || null
      const exaKey = settings.apiKeys?.exa || existingSettings?.exa_api_key || null

      if (existingSettings) {
        if (existingSettings.openrouter_api_key && !settings.apiKeys?.openRouter) {
          console.warn("[Supabase] 🛡️ PROTECTION: Preserving existing OpenRouter key, refusing to clear it")
        }
        if (existingSettings.openai_api_key && !settings.apiKeys?.openAI) {
          console.warn("[Supabase] 🛡️ PROTECTION: Preserving existing OpenAI key, refusing to clear it")
        }
        if (existingSettings.tavily_api_key && !settings.apiKeys?.tavily) {
          console.warn("[Supabase] 🛡️ PROTECTION: Preserving existing Tavily key, refusing to clear it")
        }
        if (existingSettings.serper_api_key && !settings.apiKeys?.serper) {
          console.warn("[Supabase] 🛡️ PROTECTION: Preserving existing Serper key, refusing to clear it")
        }
        if (existingSettings.exa_api_key && !settings.apiKeys?.exa) {
          console.warn("[Supabase] 🛡️ PROTECTION: Preserving existing Exa key, refusing to clear it")
        }
      }

      console.log("[Supabase] Final API keys being saved to DB:", {
        openRouter: openRouterKey ? `***${  openRouterKey.slice(-4)}` : "NULL",
        openAI: openAIKey ? `***${  openAIKey.slice(-4)}` : "NULL",
        tavily: tavilyKey ? `***${  tavilyKey.slice(-4)}` : "NULL",
        serper: serperKey ? `***${  serperKey.slice(-4)}` : "NULL",
        exa: exaKey ? `***${  exaKey.slice(-4)}` : "NULL",
      })

      const settingsData = {
        simple_mode: settings.simpleMode ?? false,
        access_tier: settings.accessTier || "standard",
        system_prompt: settings.systemPrompt,
        temperature: settings.modelParameters?.temperature,
        max_tokens: settings.modelParameters?.maxTokens,
        top_p: settings.modelParameters?.topP,
        frequency_penalty: settings.modelParameters?.frequencyPenalty,
        presence_penalty: settings.modelParameters?.presencePenalty,
        selected_model: settings.selectedModel,
        selected_models: settings.selectedModels || ["openai/gpt-5.1-codex-mini"],
        tavily_search_depth: settings.tavilySettings?.searchDepth,
        tavily_max_results: settings.tavilySettings?.maxResults,
        tavily_include_images: settings.tavilySettings?.includeImages,
        tavily_include_answer: settings.tavilySettings?.includeAnswer,
        openrouter_api_key: openRouterKey,
        openai_api_key: openAIKey,
        tavily_api_key: tavilyKey,
        serper_api_key: serperKey,
        exa_api_key: exaKey,
        search_provider: settings.searchProvider || "tavily",
        serper_max_results: settings.serperSettings?.maxResults || 5,
        serper_include_images: settings.serperSettings?.includeImages ?? true,
        serper_country: settings.serperSettings?.country || "at",
        serper_language: settings.serperSettings?.language || "de",
        use_exa_search: settings.useExaSearch ?? false,
        // Exa settings
        exa_max_results: settings.exaSettings?.maxResults || 5,
        exa_search_type: settings.exaSettings?.searchType || "auto",
        exa_use_autoprompt: settings.exaSettings?.useAutoprompt ?? true,
        exa_include_full_text: settings.exaSettings?.includeFullText ?? true,
        exa_include_highlights: settings.exaSettings?.includeHighlights ?? true,
        exa_include_summary: settings.exaSettings?.includeSummary ?? false,
        exa_highlights_per_result: settings.exaSettings?.highlightsPerResult || 3,
        exa_max_text_characters: settings.exaSettings?.maxTextCharacters || 3000,
        exa_livecrawl: settings.exaSettings?.livecrawl || "fallback",
        exa_category: settings.exaSettings?.category || null,
        memory_settings: settings.memorySettings
          ? JSON.stringify(settings.memorySettings)
          : JSON.stringify({ enabled: false, autoExtract: true, maxMemoriesInContext: 5, importanceThreshold: 2 }),
        custom_personas: settings.customPersonas
          ? JSON.stringify(settings.customPersonas)
          : '[]',
        experimental_settings: settings.experimental
          ? JSON.stringify(settings.experimental)
          : '{}',
        // Shopify settings for HiFi mode
        shopify_settings: settings.shopifySettings
          ? JSON.stringify(settings.shopifySettings)
          : '{}',
        updated_at: new Date().toISOString(),
      }

      // Use explicit INSERT or UPDATE based on whether settings exist
      let error
      if (existingSettings) {
        // UPDATE existing settings
        const result = await this.supabase
          .from("user_settings")
          .update(settingsData)
          .eq("user_id", userId)
        error = result.error
      } else {
        // INSERT new settings
        const result = await this.supabase
          .from("user_settings")
          .insert({
            user_id: userId,
            ...settingsData,
          })
        error = result.error
      }

      if (error) {
        if (error.code === "42501") {
          console.error("[Supabase] RLS policy blocking settings save. Check RLS policies!")
          return
        }
        throw error
      }
      console.log("[Supabase] Settings saved successfully for user:", userId)
    } catch (err: any) {
      console.error("[v0] Error saving settings:", err)
    }
  }

  // ===== Comparison Sessions =====
  async syncComparisonSessions(userId: string): Promise<ComparisonSession[]> {
    const { data, error } = await this.supabase
      .from("comparison_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data.map(this.mapComparisonSessionFromDB)
  }

  async saveComparisonSession(userId: string, session: ComparisonSession): Promise<void> {
    if (!session.models || session.models.length === 0) {
      console.error("[v0] Cannot save comparison session: models array is empty or undefined")
      throw new Error("Comparison session must have at least one model")
    }

    const timestamp = session.timestamp && !isNaN(session.timestamp) ? session.timestamp : Date.now()

    const { error } = await this.supabase.from("comparison_sessions").insert({
      id: session.id,
      user_id: userId,
      models: session.models,
      messages: session.messages,
      created_at: new Date(timestamp).toISOString(),
    })

    if (error) throw error
  }

  async deleteComparisonSession(userId: string, sessionId: string): Promise<void> {
    const { error } = await this.supabase.from("comparison_sessions").delete().eq("id", sessionId).eq("user_id", userId)

    if (error) throw error
  }

  async deleteAllComparisonSessions(userId: string): Promise<void> {
    const { error } = await this.supabase.from("comparison_sessions").delete().eq("user_id", userId)

    if (error) throw error
  }

  // ===== System Prompts =====
  async syncSystemPrompts(userId: string): Promise<SystemPrompt[]> {
    const { data, error } = await this.supabase
      .from("system_prompts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data.map(this.mapSystemPromptFromDB)
  }

  async createSystemPrompt(userId: string, prompt: SystemPrompt): Promise<void> {
    const { error } = await this.supabase.from("system_prompts").insert({
      id: prompt.id,
      user_id: userId,
      name: prompt.name,
      description: prompt.description || null,
      prompt: prompt.prompt,
      is_default: prompt.isDefault,
      created_at: new Date(prompt.createdAt).toISOString(),
      updated_at: new Date(prompt.updatedAt).toISOString(),
    })

    if (error) throw error
  }

  async updateSystemPrompt(userId: string, prompt: SystemPrompt): Promise<void> {
    const { error } = await this.supabase
      .from("system_prompts")
      .update({
        name: prompt.name,
        description: prompt.description || null,
        prompt: prompt.prompt,
        is_default: prompt.isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prompt.id)
      .eq("user_id", userId)

    if (error) throw error
  }

  async deleteSystemPrompt(userId: string, promptId: string): Promise<void> {
    const { error } = await this.supabase.from("system_prompts").delete().eq("id", promptId).eq("user_id", userId)

    if (error) throw error
  }

  async setDefaultSystemPrompt(userId: string, promptId: string): Promise<void> {
    // First, unset all defaults
    const { error: unsetError } = await this.supabase
      .from("system_prompts")
      .update({ is_default: false })
      .eq("user_id", userId)

    if (unsetError) throw unsetError

    // Then set the new default
    const { error: setError } = await this.supabase
      .from("system_prompts")
      .update({ is_default: true })
      .eq("id", promptId)
      .eq("user_id", userId)

    if (setError) throw setError
  }

  // ===== Usage Tracking =====
  async trackUsage(
    userId: string,
    chatId: string,
    messageId: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    estimatedCost: number,
  ): Promise<void> {
    const { error } = await this.supabase.from("usage_tracking").insert({
      user_id: userId,
      chat_id: chatId,
      message_id: messageId,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
      estimated_cost: estimatedCost,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Failed to track usage:", error)
    }
  }

  async getUserUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalTokens: number
    totalCost: number
    messageCount: number
    modelUsage: Record<string, { tokens: number; cost: number; count: number }>
  }> {
    let query = this.supabase.from("usage_tracking").select("*").eq("user_id", userId)

    if (startDate) {
      query = query.gte("created_at", startDate.toISOString())
    }
    if (endDate) {
      query = query.lte("created_at", endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Failed to load usage stats:", error)
      return {
        totalTokens: 0,
        totalCost: 0,
        messageCount: 0,
        modelUsage: {},
      }
    }

    const stats = {
      totalTokens: 0,
      totalCost: 0,
      messageCount: data.length,
      modelUsage: {} as Record<string, { tokens: number; cost: number; count: number }>,
    }

    for (const record of data) {
      stats.totalTokens += record.total_tokens
      stats.totalCost += Number.parseFloat(record.estimated_cost) || 0

      if (!stats.modelUsage[record.model]) {
        stats.modelUsage[record.model] = { tokens: 0, cost: 0, count: 0 }
      }

      stats.modelUsage[record.model].tokens += record.total_tokens
      stats.modelUsage[record.model].cost += Number.parseFloat(record.estimated_cost) || 0
      stats.modelUsage[record.model].count += 1
    }

    return stats
  }

  // ===== Memories =====
  async syncMemories(userId: string): Promise<Memory[]> {
    const { data, error } = await this.supabase
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Supabase] Error syncing memories:", error)
      throw error
    }

    console.log("[Supabase] Synced", data.length, "memories from database")
    return data.map(this.mapMemoryFromDB)
  }

  async createMemory(userId: string, memory: Memory): Promise<void> {
    console.log("[Supabase] Creating memory:", memory.type, "-", memory.content.substring(0, 40))

    // CRITICAL: Verify session and get actual auth.uid() to match RLS policy
    // RLS requires auth.uid() = user_id, so we must use the authenticated user's ID
    const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser()

    console.log("[Supabase] Auth check result:", {
      hasUser: !!authUser,
      authUserId: authUser?.id?.substring(0, 8) || "none",
      passedUserId: userId?.substring(0, 8) || "none",
      authError: authError?.message || "none"
    })

    if (!authUser) {
      console.error("[Supabase] Cannot create memory: No authenticated user. Auth error:", authError)
      throw new Error("Not authenticated - please log in again")
    }

    // Use the authenticated user's ID to satisfy RLS policy (auth.uid() = user_id)
    const actualUserId = authUser.id
    if (actualUserId !== userId) {
      console.warn("[Supabase] userId mismatch - using auth.uid():", { passed: userId.substring(0, 8), auth: actualUserId.substring(0, 8) })
    }

    console.log("[Supabase] Inserting memory with user_id:", actualUserId.substring(0, 8))

    const { error } = await this.supabase.from("memories").insert({
      id: memory.id,
      user_id: actualUserId, // Use auth user ID to satisfy RLS
      type: memory.type,
      content: memory.content,
      category: memory.category || null,
      importance: memory.importance,
      source: memory.source || null,
      metadata: memory.metadata || {},
      access_count: memory.accessCount,
      created_at: new Date(memory.createdAt).toISOString(),
      last_accessed_at: new Date(memory.lastAccessedAt).toISOString(),
    })

    if (error) {
      // Ignore duplicate key errors
      if (error.code === "23505") {
        console.log("[Supabase] Memory already exists, skipping:", memory.id)
        return
      }
      console.error("[Supabase] Error creating memory:", error)
      throw error
    }

    console.log("[Supabase] Memory created successfully:", memory.id)
  }

  async updateMemory(userId: string, memory: Memory): Promise<void> {
    const { error } = await this.supabase
      .from("memories")
      .update({
        content: memory.content,
        category: memory.category || null,
        importance: memory.importance,
        metadata: memory.metadata || {},
        access_count: memory.accessCount,
        last_accessed_at: new Date(memory.lastAccessedAt).toISOString(),
      })
      .eq("id", memory.id)
      .eq("user_id", userId)

    if (error) {
      console.error("[Supabase] Error updating memory:", error)
      throw error
    }
  }

  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    const { error } = await this.supabase
      .from("memories")
      .delete()
      .eq("id", memoryId)
      .eq("user_id", userId)

    if (error) {
      console.error("[Supabase] Error deleting memory:", error)
      throw error
    }

    console.log("[Supabase] Memory deleted:", memoryId)
  }

  async deleteAllMemories(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("memories")
      .delete()
      .eq("user_id", userId)

    if (error) {
      console.error("[Supabase] Error deleting all memories:", error)
      throw error
    }

    console.log("[Supabase] All memories deleted for user")
  }

  private mapMemoryFromDB(dbMemory: any): Memory {
    return {
      id: dbMemory.id,
      type: dbMemory.type,
      content: dbMemory.content,
      category: dbMemory.category || undefined,
      importance: dbMemory.importance,
      source: dbMemory.source || undefined,
      metadata: dbMemory.metadata || undefined,
      accessCount: dbMemory.access_count || 0,
      createdAt: new Date(dbMemory.created_at).getTime(),
      lastAccessedAt: new Date(dbMemory.last_accessed_at).getTime(),
      embedding: dbMemory.embedding || undefined,
    }
  }

  /**
   * Update memory embedding in database
   */
  async updateMemoryEmbedding(userId: string, memoryId: string, embedding: number[]): Promise<void> {
    // Use RPC function to ensure proper vector type handling
    // Format as string for pgvector: "[0.1,0.2,...]"
    const embeddingString = `[${embedding.join(",")}]`

    const { error } = await this.supabase.rpc("update_memory_embedding", {
      p_memory_id: memoryId,
      p_user_id: userId,
      p_embedding: embeddingString,
    })

    if (error) {
      console.error("[Supabase] Error updating memory embedding:", error)
      throw error
    }

    console.log("[Supabase] Memory embedding updated:", memoryId.substring(0, 8))
  }

  /**
   * Semantic search for memories using pgvector
   * Returns memories ordered by similarity to the query embedding
   */
  async semanticSearchMemories(
    userId: string,
    queryEmbedding: number[],
    options: { threshold?: number; limit?: number } = {}
  ): Promise<Array<Memory & { similarity: number }>> {
    const { threshold = 0.5, limit = 5 } = options

    // Format query embedding as pgvector string: "[0.1,0.2,...]"
    // This is the format pgvector RPC functions expect
    const embeddingString = `[${queryEmbedding.join(",")}]`

    // Use pgvector's cosine distance operator (<=>)
    // 1 - distance = similarity (cosine distance is 1 - cosine similarity)
    const { data, error } = await this.supabase
      .rpc("search_memories_by_embedding", {
        query_embedding: embeddingString,
        match_threshold: threshold,
        match_count: limit,
        p_user_id: userId,
      })

    if (error) {
      console.error("[Supabase] Semantic search error:", error)
      // Fallback: if RPC doesn't exist, return empty (will use client-side search)
      if (error.code === "42883") {
        console.warn("[Supabase] search_memories_by_embedding function not found, using client-side search")
        return []
      }
      throw error
    }

    console.log("[Supabase] Semantic search found", data?.length || 0, "memories")

    return (data || []).map((item: any) => ({
      ...this.mapMemoryFromDB(item),
      similarity: item.similarity,
    }))
  }

  // ===== Deleted Memories =====

  /**
   * Sync deleted memories from database
   */
  async syncDeletedMemories(userId: string): Promise<DeletedMemory[]> {
    const { data, error } = await this.supabase
      .from("deleted_memories")
      .select("*")
      .eq("user_id", userId)
      .order("deleted_at", { ascending: false })

    if (error) {
      // Table might not exist yet
      if (error.code === "42P01") {
        console.warn("[Supabase] deleted_memories table not found - run migration 045")
        return []
      }
      console.error("[Supabase] Error syncing deleted memories:", error)
      throw error
    }

    console.log("[Supabase] Synced", data.length, "deleted memories from database")
    return data.map(this.mapDeletedMemoryFromDB)
  }

  /**
   * Create a deleted memory in database (archive)
   */
  async createDeletedMemory(userId: string, deletedMemory: DeletedMemory): Promise<void> {
    console.log("[Supabase] Archiving memory:", deletedMemory.content.substring(0, 40))

    // Verify authentication
    const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser()

    if (!authUser) {
      console.error("[Supabase] Cannot archive memory: No authenticated user")
      throw new Error("Not authenticated - please log in again")
    }

    const actualUserId = authUser.id

    const { error } = await this.supabase.from("deleted_memories").insert({
      id: deletedMemory.id,
      user_id: actualUserId,
      original_memory_id: deletedMemory.id, // Same as id since we're archiving the original
      type: deletedMemory.type,
      content: deletedMemory.content,
      category: deletedMemory.category || null,
      importance: deletedMemory.importance,
      original_importance: deletedMemory.originalImportance || null,
      source: deletedMemory.source || null,
      metadata: deletedMemory.metadata || {},
      access_count: deletedMemory.accessCount,
      created_at: new Date(deletedMemory.createdAt).toISOString(),
      deleted_at: new Date(deletedMemory.deletedAt).toISOString(),
      expires_at: new Date(deletedMemory.expiresAt).toISOString(),
      deletion_reason: deletedMemory.deletionReason,
    })

    if (error) {
      // Ignore duplicate key errors
      if (error.code === "23505") {
        console.log("[Supabase] Deleted memory already exists, skipping:", deletedMemory.id)
        return
      }
      // Table might not exist
      if (error.code === "42P01") {
        console.warn("[Supabase] deleted_memories table not found - run migration 045")
        return
      }
      console.error("[Supabase] Error archiving memory:", error)
      throw error
    }

    console.log("[Supabase] Memory archived successfully:", deletedMemory.id)
  }

  /**
   * Delete a memory from the deleted archive (restore or permanent delete)
   */
  async removeDeletedMemory(userId: string, memoryId: string): Promise<void> {
    const { error } = await this.supabase
      .from("deleted_memories")
      .delete()
      .eq("id", memoryId)
      .eq("user_id", userId)

    if (error) {
      // Table might not exist
      if (error.code === "42P01") {
        console.warn("[Supabase] deleted_memories table not found - run migration 045")
        return
      }
      console.error("[Supabase] Error removing deleted memory:", error)
      throw error
    }

    console.log("[Supabase] Deleted memory removed from archive:", memoryId)
  }

  /**
   * Delete all memories from the deleted archive
   */
  async clearDeletedMemories(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("deleted_memories")
      .delete()
      .eq("user_id", userId)

    if (error) {
      if (error.code === "42P01") {
        console.warn("[Supabase] deleted_memories table not found")
        return
      }
      console.error("[Supabase] Error clearing deleted memories:", error)
      throw error
    }

    console.log("[Supabase] All deleted memories cleared for user")
  }

  /**
   * Cleanup expired deleted memories (removes those past expires_at)
   */
  async cleanupExpiredDeletedMemories(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from("deleted_memories")
      .delete()
      .eq("user_id", userId)
      .lt("expires_at", new Date().toISOString())
      .select("id")

    if (error) {
      if (error.code === "42P01") {
        return 0
      }
      console.error("[Supabase] Error cleaning up expired memories:", error)
      throw error
    }

    const count = data?.length || 0
    if (count > 0) {
      console.log("[Supabase] Cleaned up", count, "expired deleted memories")
    }
    return count
  }

  private mapDeletedMemoryFromDB(dbMemory: any): DeletedMemory {
    return {
      id: dbMemory.id,
      type: dbMemory.type,
      content: dbMemory.content,
      category: dbMemory.category || undefined,
      importance: dbMemory.importance,
      originalImportance: dbMemory.original_importance || undefined,
      source: dbMemory.source || undefined,
      metadata: dbMemory.metadata || undefined,
      accessCount: dbMemory.access_count || 0,
      createdAt: new Date(dbMemory.created_at).getTime(),
      lastAccessedAt: new Date(dbMemory.created_at).getTime(), // Use created_at as fallback
      deletedAt: new Date(dbMemory.deleted_at).getTime(),
      expiresAt: new Date(dbMemory.expires_at).getTime(),
      deletionReason: dbMemory.deletion_reason,
    }
  }

  // ===== Chat Shares =====

  /**
   * Generate a unique share token
   */
  private generateShareToken(): string {
    // Generate a URL-safe random token (12 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  /**
   * Create a new share for a chat
   */
  async createShare(userId: string, chatId: string, options?: { title?: string; expiresAt?: Date }): Promise<ChatShare> {
    console.log("[Supabase] Creating share for chat:", chatId)

    const shareToken = this.generateShareToken()
    const now = new Date().toISOString()

    const { data, error } = await this.supabase
      .from("chat_shares")
      .insert({
        chat_id: chatId,
        owner_id: userId,
        share_token: shareToken,
        title: options?.title || null,
        expires_at: options?.expiresAt?.toISOString() || null,
        is_active: true,
        view_count: 0,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      console.error("[Supabase] Error creating share:", error)
      throw error
    }

    console.log("[Supabase] Share created successfully:", data.share_token)
    return this.mapShareFromDB(data)
  }

  /**
   * Get all shares for a user
   */
  async getShares(userId: string): Promise<ChatShare[]> {
    const { data, error } = await this.supabase
      .from("chat_shares")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Supabase] Error fetching shares:", error)
      throw error
    }

    return data.map(this.mapShareFromDB)
  }

  /**
   * Get shares for a specific chat
   */
  async getSharesForChat(userId: string, chatId: string): Promise<ChatShare[]> {
    const { data, error } = await this.supabase
      .from("chat_shares")
      .select("*")
      .eq("owner_id", userId)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Supabase] Error fetching shares for chat:", error)
      throw error
    }

    return data.map(this.mapShareFromDB)
  }

  /**
   * Update a share (e.g., toggle active status, update title)
   */
  async updateShare(userId: string, shareId: string, updates: { title?: string; isActive?: boolean; expiresAt?: Date | null }): Promise<void> {
    const updateData: any = { updated_at: new Date().toISOString() }

    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive
    if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt?.toISOString() || null

    const { error } = await this.supabase
      .from("chat_shares")
      .update(updateData)
      .eq("id", shareId)
      .eq("owner_id", userId)

    if (error) {
      console.error("[Supabase] Error updating share:", error)
      throw error
    }

    console.log("[Supabase] Share updated:", shareId)
  }

  /**
   * Delete a share
   */
  async deleteShare(userId: string, shareId: string): Promise<void> {
    const { error } = await this.supabase
      .from("chat_shares")
      .delete()
      .eq("id", shareId)
      .eq("owner_id", userId)

    if (error) {
      console.error("[Supabase] Error deleting share:", error)
      throw error
    }

    console.log("[Supabase] Share deleted:", shareId)
  }

  /**
   * Get shared chat data by share token (public access - uses RPC function)
   */
  async getSharedChat(shareToken: string): Promise<SharedChatData | null> {
    console.log("[Supabase] Fetching shared chat:", shareToken)

    const { data, error } = await this.supabase
      .rpc("get_shared_chat", { p_share_token: shareToken })

    if (error) {
      console.error("[Supabase] Error fetching shared chat:", error)
      throw error
    }

    if (!data || data.length === 0) {
      console.log("[Supabase] Shared chat not found or expired")
      return null
    }

    const row = data[0]
    return {
      shareId: row.share_id,
      chatId: row.chat_id,
      shareTitle: row.share_title || undefined,
      chatTitle: row.chat_title,
      ownerId: row.owner_id,
      viewCount: row.view_count,
      createdAt: new Date(row.created_at).getTime(),
      messages: (row.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        model: m.model || undefined,
        createdAt: new Date(m.created_at).getTime(),
      })),
    }
  }

  private mapShareFromDB(dbShare: any): ChatShare {
    return {
      id: dbShare.id,
      chatId: dbShare.chat_id,
      ownerId: dbShare.owner_id,
      shareToken: dbShare.share_token,
      title: dbShare.title || undefined,
      expiresAt: dbShare.expires_at ? new Date(dbShare.expires_at).getTime() : undefined,
      isActive: dbShare.is_active,
      viewCount: dbShare.view_count,
      createdAt: new Date(dbShare.created_at).getTime(),
      updatedAt: new Date(dbShare.updated_at).getTime(),
    }
  }

  // ===== Mappers =====
  private mapChatFromDB(dbChat: any): Chat {
    return {
      id: dbChat.id,
      title: dbChat.title,
      messages: [], // Messages loaded separately
      createdAt: new Date(dbChat.created_at).getTime(),
      updatedAt: new Date(dbChat.updated_at).getTime(),
      pinned: dbChat.pinned,
      model: dbChat.model || "x-ai/grok-4.1-fast:free",
      folderId: dbChat.folder_id || undefined,
    }
  }

  private mapMessageFromDB(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      role: dbMessage.role,
      content: dbMessage.content,
      timestamp: new Date(dbMessage.created_at).getTime(),
    }
  }

  private mapFolderFromDB(dbFolder: any): Folder {
    return {
      id: dbFolder.id,
      name: dbFolder.name,
      createdAt: new Date(dbFolder.created_at).getTime(),
      updatedAt: new Date(dbFolder.updated_at).getTime(),
    }
  }

  private mapSettingsFromDB(dbSettings: any): AppSettings {
    // DEBUG: Log API keys being loaded
    console.log("[Supabase] Loading API keys from DB:", {
      openRouter: dbSettings.openrouter_api_key ? `***${  dbSettings.openrouter_api_key.slice(-4)}` : "NULL/empty",
      openAI: dbSettings.openai_api_key ? `***${  dbSettings.openai_api_key.slice(-4)}` : "NULL/empty",
      tavily: dbSettings.tavily_api_key ? `***${  dbSettings.tavily_api_key.slice(-4)}` : "NULL/empty",
      serper: dbSettings.serper_api_key ? `***${  dbSettings.serper_api_key.slice(-4)}` : "NULL/empty",
      exa: dbSettings.exa_api_key ? `***${  dbSettings.exa_api_key.slice(-4)}` : "NULL/empty",
    })

    // DEBUG: Log memory settings being loaded
    console.log("[Supabase] Loading memorySettings from DB:", {
      raw: dbSettings.memory_settings,
      type: typeof dbSettings.memory_settings,
    })

    return {
      simpleMode: dbSettings.simple_mode ?? false,
      accessTier: (dbSettings.access_tier as AccessTier) || "standard",
      systemPrompt:
        dbSettings.system_prompt ||
        "You are a helpful, knowledgeable AI assistant. Provide comprehensive, detailed, and well-structured answers. When answering questions, be thorough and explain concepts fully. Use examples where appropriate. Don't cut answers short - complete your thoughts and provide meaningful, substantive responses. Am Ende jeder Antwort schlägst du 2-3 passende next possible User prompts vor im Format: [FOLLOWUP]Frage 1|Frage 2|Frage 3[/FOLLOWUP] , vor diesem follow up schreibst du mir 1-3 anregende Fragen zum fortführen der diskussion wenn es passt. aber formuliere dies immer etwas anders.",
      modelParameters: {
        temperature: Number.parseFloat(dbSettings.temperature) || 0.7,
        maxTokens: dbSettings.max_tokens || 16000,
        topP: Number.parseFloat(dbSettings.top_p) || 1.0,
        frequencyPenalty: Number.parseFloat(dbSettings.frequency_penalty) || 0.0,
        presencePenalty: Number.parseFloat(dbSettings.presence_penalty) || 0.0,
      },
      selectedModel: dbSettings.selected_model || "openai/gpt-5.1-codex-mini",
      selectedModels: dbSettings.selected_models || ["openai/gpt-5.1-codex-mini"],
      apiKeys: {
        // CRITICAL: Return undefined for NULL database values instead of empty strings
        // This allows localStorage keys to be preserved during merge in app-context
        openRouter: dbSettings.openrouter_api_key || undefined,
        openAI: dbSettings.openai_api_key || undefined,
        tavily: dbSettings.tavily_api_key || undefined,
        serper: dbSettings.serper_api_key || undefined,
        exa: dbSettings.exa_api_key || undefined,
      },
      searchProvider: dbSettings.search_provider || "tavily",
      tavilySettings: {
        searchDepth: dbSettings.tavily_search_depth || "basic",
        maxResults: dbSettings.tavily_max_results || 5,
        includeImages: dbSettings.tavily_include_images ?? false,
        includeAnswer: dbSettings.tavily_include_answer ?? true,
      },
      serperSettings: {
        maxResults: dbSettings.serper_max_results || 5,
        includeImages: dbSettings.serper_include_images ?? false,
        country: dbSettings.serper_country || "at",
        language: dbSettings.serper_language || "de",
      },
      exaSettings: {
        maxResults: dbSettings.exa_max_results || 5,
        searchType: dbSettings.exa_search_type || "auto",
        useAutoprompt: dbSettings.exa_use_autoprompt ?? true,
        includeFullText: dbSettings.exa_include_full_text ?? true,
        includeHighlights: dbSettings.exa_include_highlights ?? true,
        includeSummary: dbSettings.exa_include_summary ?? false,
        includeImages: dbSettings.exa_include_images ?? false,
        highlightsPerResult: dbSettings.exa_highlights_per_result || 3,
        maxTextCharacters: dbSettings.exa_max_text_characters || 3000,
        livecrawl: dbSettings.exa_livecrawl || "fallback",
        category: dbSettings.exa_category || undefined,
      },
      useExaSearch: dbSettings.use_exa_search ?? false,
      memorySettings: (() => {
        const parsed = dbSettings.memory_settings
          ? (typeof dbSettings.memory_settings === "string"
              ? JSON.parse(dbSettings.memory_settings)
              : dbSettings.memory_settings)
          : { enabled: false, autoExtract: true, maxMemoriesInContext: 5, importanceThreshold: 2 }

        console.log("[Supabase] Parsed memorySettings:", parsed)
        return parsed
      })(),
      customPersonas: (() => {
        const parsed = dbSettings.custom_personas
          ? (typeof dbSettings.custom_personas === "string"
              ? JSON.parse(dbSettings.custom_personas)
              : Array.isArray(dbSettings.custom_personas)
              ? dbSettings.custom_personas
              : [])
          : []

        console.log("[Supabase] Parsed customPersonas:", parsed)
        return parsed
      })(),
      experimental: (() => {
        const parsed = dbSettings.experimental_settings
          ? (typeof dbSettings.experimental_settings === "string"
              ? JSON.parse(dbSettings.experimental_settings)
              : dbSettings.experimental_settings)
          : {}

        console.log("[Supabase] Parsed experimental settings:", parsed)
        return parsed
      })(),
      // Shopify settings for HiFi mode
      shopifySettings: (() => {
        if (!dbSettings.shopify_settings) return undefined

        const parsed = typeof dbSettings.shopify_settings === "string"
          ? JSON.parse(dbSettings.shopify_settings)
          : dbSettings.shopify_settings

        console.log("[Supabase] Parsed shopifySettings:", parsed?.storeUrl ? "***configured***" : "empty")
        return parsed
      })(),
    }
  }

  private mapComparisonSessionFromDB(dbSession: any): ComparisonSession {
    let timestamp = Date.now()
    try {
      const parsedDate = new Date(dbSession.created_at)
      if (!isNaN(parsedDate.getTime())) {
        timestamp = parsedDate.getTime()
      }
    } catch (e) {
      console.error("[v0] Invalid date in comparison session:", dbSession.created_at)
    }

    return {
      id: dbSession.id,
      models: dbSession.models || [],
      messages: dbSession.messages || [],
      timestamp,
    }
  }

  private mapSystemPromptFromDB(dbPrompt: any): SystemPrompt {
    return {
      id: dbPrompt.id,
      name: dbPrompt.name,
      description: dbPrompt.description || "",
      prompt: dbPrompt.prompt,
      isDefault: dbPrompt.is_default,
      createdAt: new Date(dbPrompt.created_at).getTime(),
      updatedAt: new Date(dbPrompt.updated_at).getTime(),
    }
  }

  // ===== User Profile =====
  async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Profile doesn't exist yet
        return null
      }
      throw error
    }

    return {
      name: data.name || undefined,
      age: data.age || undefined,
      occupation: data.occupation || undefined,
      location: data.location || undefined,
      aboutMe: data.about_me || undefined,
      interests: data.interests || [],
      goals: data.goals || [],
      preferences: {
        communicationStyle: data.communication_style || undefined,
        topicsToAvoid: data.topics_to_avoid || [],
      },
    }
  }

  async saveUserProfile(userId: string, profile: any): Promise<void> {
    console.log("[v0] Saving user profile to Supabase:", userId)

    const { error } = await this.supabase
      .from("profiles")
      .update({
        name: profile.name || null,
        age: profile.age || null,
        occupation: profile.occupation || null,
        location: profile.location || null,
        about_me: profile.aboutMe || null,
        interests: profile.interests || [],
        goals: profile.goals || [],
        communication_style: profile.preferences?.communicationStyle || null,
        topics_to_avoid: profile.preferences?.topicsToAvoid || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("[v0] Error saving user profile:", error)
      throw error
    }

    console.log("[v0] User profile saved successfully")
  }
}

export const supabaseSync = new SupabaseSync()
