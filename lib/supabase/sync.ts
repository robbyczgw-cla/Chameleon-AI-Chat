import { createClient } from "@/lib/supabase/client"
import type { Chat, Folder, Message, AppSettings, ComparisonSession, SystemPrompt } from "@/types"

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

    const { error } = await this.supabase.from("messages").insert({
      id: message.id, // Use existing UUID from message object
      chat_id: chatId,
      role: message.role,
      content: message.content,
      model: message.model || "x-ai/grok-4-fast",
      created_at: new Date(message.timestamp).toISOString(),
    })

    if (error) {
      console.error("[v0] ERROR saving message to Supabase:", error)
      throw error
    }
    console.log("[v0] Message saved successfully to Supabase:", message.id)
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
        openRouter: settings.apiKeys?.openRouter ? "***" + settings.apiKeys.openRouter.slice(-4) : "empty",
        openAI: settings.apiKeys?.openAI ? "***" + settings.apiKeys.openAI.slice(-4) : "empty",
        tavily: settings.apiKeys?.tavily ? "***" + settings.apiKeys.tavily.slice(-4) : "empty",
        serper: settings.apiKeys?.serper ? "***" + settings.apiKeys.serper.slice(-4) : "empty",
      })

      // CRITICAL: Get existing settings to preserve API keys if new settings have empty values
      const { data: existingSettings } = await this.supabase
        .from("user_settings")
        .select("openrouter_api_key, openai_api_key, tavily_api_key, serper_api_key")
        .eq("user_id", userId)
        .single()

      // Prepare API key values - NEVER overwrite existing keys with null/empty
      const openRouterKey = settings.apiKeys?.openRouter || existingSettings?.openrouter_api_key || null
      const openAIKey = settings.apiKeys?.openAI || existingSettings?.openai_api_key || null
      const tavilyKey = settings.apiKeys?.tavily || existingSettings?.tavily_api_key || null
      const serperKey = settings.apiKeys?.serper || existingSettings?.serper_api_key || null

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
      }

      const { error } = await this.supabase.from("user_settings").upsert(
        {
          user_id: userId,
          system_prompt: settings.systemPrompt,
          temperature: settings.modelParameters.temperature,
          max_tokens: settings.modelParameters.maxTokens,
          top_p: settings.modelParameters.topP,
          frequency_penalty: settings.modelParameters.frequencyPenalty,
          presence_penalty: settings.modelParameters.presencePenalty,
          selected_model: settings.selectedModel,
          selected_models: settings.selectedModels || ["x-ai/grok-4-fast"],
          tavily_search_depth: settings.tavilySettings.searchDepth,
          tavily_max_results: settings.tavilySettings.maxResults,
          tavily_include_images: settings.tavilySettings.includeImages,
          tavily_include_answer: settings.tavilySettings.includeAnswer,
          openrouter_api_key: openRouterKey,
          openai_api_key: openAIKey,
          tavily_api_key: tavilyKey,
          serper_api_key: serperKey,
          search_provider: settings.searchProvider || "tavily",
          serper_max_results: settings.serperSettings?.maxResults || 5,
          serper_include_images: settings.serperSettings?.includeImages ?? true,
          serper_country: settings.serperSettings?.country || "at",
          serper_language: settings.serperSettings?.language || "de",
          use_exa_search: settings.useExaSearch ?? false,
          memory_settings: settings.memorySettings
            ? JSON.stringify(settings.memorySettings)
            : JSON.stringify({ enabled: false, autoExtract: true, maxMemoriesInContext: 5, importanceThreshold: 2 }),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        },
      )

      if (error) {
        if (error.code === "42501") {
          console.error("[v0] RLS policy blocking settings save. Run SQL script 008_fix_rls_insert_policy.sql!")
          return
        }
        if (error.code === "23505") {
          console.log("[v0] Settings already exist, trying update...")
          const { error: updateError } = await this.supabase
            .from("user_settings")
            .update({
              system_prompt: settings.systemPrompt,
              temperature: settings.modelParameters.temperature,
              max_tokens: settings.modelParameters.maxTokens,
              top_p: settings.modelParameters.topP,
              frequency_penalty: settings.modelParameters.frequencyPenalty,
              presence_penalty: settings.modelParameters.presencePenalty,
              selected_model: settings.selectedModel,
              selected_models: settings.selectedModels || ["x-ai/grok-4-fast"],
              tavily_search_depth: settings.tavilySettings.searchDepth,
              tavily_max_results: settings.tavilySettings.maxResults,
              tavily_include_images: settings.tavilySettings.includeImages,
              tavily_include_answer: settings.tavilySettings.includeAnswer,
              openrouter_api_key: settings.apiKeys?.openRouter || null,
              openai_api_key: settings.apiKeys?.openAI || null,
              tavily_api_key: settings.apiKeys?.tavily || null,
              serper_api_key: settings.apiKeys?.serper || null,
              search_provider: settings.searchProvider || "tavily",
              serper_max_results: settings.serperSettings?.maxResults || 5,
              serper_include_images: settings.serperSettings?.includeImages ?? true,
              serper_country: settings.serperSettings?.country || "at",
              serper_language: settings.serperSettings?.language || "de",
              use_exa_search: settings.useExaSearch ?? false,
              memory_settings: settings.memorySettings
                ? JSON.stringify(settings.memorySettings)
                : JSON.stringify({ enabled: false, autoExtract: true, maxMemoriesInContext: 5, importanceThreshold: 2 }),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)

          if (updateError && updateError.code !== "42501") {
            throw updateError
          }
          return
        }
        throw error
      }
      console.log("[v0] Settings saved for user:", userId)
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

  // ===== Mappers =====
  private mapChatFromDB(dbChat: any): Chat {
    return {
      id: dbChat.id,
      title: dbChat.title,
      messages: [], // Messages loaded separately
      createdAt: new Date(dbChat.created_at).getTime(),
      updatedAt: new Date(dbChat.updated_at).getTime(),
      pinned: dbChat.pinned,
      model: dbChat.model || "x-ai/grok-4-fast",
      folderId: dbChat.folder_id || undefined,
    }
  }

  private mapMessageFromDB(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      role: dbMessage.role,
      content: dbMessage.content,
      timestamp: new Date(dbMessage.created_at).getTime(),
      model: dbMessage.model || undefined,
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
      openRouter: dbSettings.openrouter_api_key ? "***" + dbSettings.openrouter_api_key.slice(-4) : "NULL/empty",
      openAI: dbSettings.openai_api_key ? "***" + dbSettings.openai_api_key.slice(-4) : "NULL/empty",
      tavily: dbSettings.tavily_api_key ? "***" + dbSettings.tavily_api_key.slice(-4) : "NULL/empty",
      serper: dbSettings.serper_api_key ? "***" + dbSettings.serper_api_key.slice(-4) : "NULL/empty",
    })

    return {
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
      selectedModel: dbSettings.selected_model || "x-ai/grok-4-fast",
      selectedModels: dbSettings.selected_models || ["x-ai/grok-4-fast"],
      apiKeys: {
        openRouter: dbSettings.openrouter_api_key || "",
        openAI: dbSettings.openai_api_key || "",
        tavily: dbSettings.tavily_api_key || "",
        serper: dbSettings.serper_api_key || "",
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
      useExaSearch: dbSettings.use_exa_search ?? false,
      memorySettings: dbSettings.memory_settings
        ? (typeof dbSettings.memory_settings === "string"
            ? JSON.parse(dbSettings.memory_settings)
            : dbSettings.memory_settings)
        : { enabled: false, autoExtract: true, maxMemoriesInContext: 5, importanceThreshold: 2 },
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
