# Research Prompts for Search Providers & Tool Calling Models
## Copy-paste these prompts to research with any LLM

---

## 🔍 Search Provider Research Prompts

### Prompt 1: Provider Comparison (General)

```
I'm building an AI chatbot with automatic web search using OpenRouter API. Compare these search providers for streaming reliability and performance in December 2025:

1. Tavily AI
2. Serper.dev (Google Search API)
3. Exa AI

For each provider, analyze:
- Average response time (with sources/benchmarks)
- Reliability/uptime percentage
- Cost per 1000 queries
- Best use cases
- Compatibility with LLM tool calling
- Streaming reliability (does it work well with SSE streaming?)
- API rate limits
- Content quality (snippet length, relevance, freshness)

Provide a comparison table and recommend which is best for:
- Production chatbots with automatic search
- Budget-conscious applications
- Research/semantic search
- Real-time data queries

Include sources and recent benchmark data if available.
```

---

### Prompt 2: Exa AI Deep Dive

```
Analyze Exa AI's search API performance and configuration for December 2025:

1. Why might Exa cause streaming timeouts in AI applications?
2. Optimal settings for automatic web search (not manual research)
3. What do these parameters impact:
   - includeFullText (true/false)
   - livecrawl ("never", "fallback", "always")
   - maxTextCharacters (500 vs 3000)
   - numResults (3 vs 5 vs 10)
   - searchType ("keyword", "neural", "auto")
   - useAutoprompt (true/false)
   - highlightsPerResult

4. Compare response times for:
   - Minimal config (highlights only, no full text, livecrawl=never)
   - Default config (full text, highlights, livecrawl=fallback)
   - Maximum config (all features enabled)

5. When should Exa be used vs simpler providers like Serper?

Provide specific configuration recommendations for:
- Streaming chatbots (need <2s response)
- Research tools (quality > speed)
- Budget applications (minimize API costs)

Include any recent performance benchmarks or case studies.
```

---

### Prompt 3: Serper vs Tavily Head-to-Head

```
Compare Serper.dev and Tavily AI for automatic web search in AI agents (December 2025):

Create a detailed comparison table covering:

**Performance:**
- Average response time
- P95/P99 latency
- Streaming compatibility
- Reliability/uptime

**Quality:**
- Result relevance
- Snippet length and quality
- Knowledge graph/answer boxes
- Image search support
- Time filtering options

**Cost:**
- Price per 1000 queries
- Free tier limits
- Volume discounts

**Developer Experience:**
- API simplicity
- Error handling
- Rate limits
- Documentation quality

**Use Cases:**
- Real-time search (news, prices, weather)
- General knowledge queries
- Localized results
- Academic/research content

Which provider would you recommend for:
1. Production chatbot with 1000 searches/day
2. Budget startup (<$50/month search costs)
3. Maximum reliability (99%+ uptime needed)
4. Best result quality

Provide specific scenarios where each excels and include any benchmark data.
```

---

### Prompt 4: Search Provider Settings Optimization

```
I'm using [PROVIDER NAME] for automatic web search in an AI chatbot. The search is triggered by LLM tool calling.

Current issues:
- Sometimes takes >5 seconds to respond
- Occasionally causes streaming to fail
- Response payloads can be very large

Analyze optimal settings for this provider:

1. How many results should I fetch? (3, 5, 10?)
2. Should I include images? (impact on speed/cost)
3. What about search depth/quality settings?
4. Time filtering - when to use it?
5. Content options (full text, snippets, highlights)?
6. Any caching strategies?

For each setting, explain:
- Impact on response time
- Impact on cost
- Impact on result quality
- Best practice recommendations

Provide a "fast config" (optimize for speed) and "quality config" (optimize for relevance) with exact parameter values.

Also explain how to detect when search is taking too long and implement timeout handling.
```

---

## 🤖 Model Research Prompts

### Prompt 5: Best Models for Tool Calling (December 2025)

```
I need to choose an LLM for production use with automatic tool calling (web search, URL fetching, code execution).

Research the best models for tool calling as of December 2025:

1. Grok 4.1 Fast (xAI)
2. Gemini 2.0 Flash (Google)
3. Claude 3.7 Sonnet (Anthropic)
4. GPT-4o (OpenAI)
5. DeepSeek V3.2 (DeepSeek)
6. DeepSeek Terminus
7. Llama 3.3 70B (Meta)
8. Qwen 2.5 72B (Alibaba)

For each model, provide:

**Tool Calling Performance:**
- Berkeley Function Calling Leaderboard score (if available)
- τ²-bench score (if available)
- Success rate with complex tool chains
- Multi-turn tool calling capability
- Parallel tool execution support

**Practical Metrics:**
- Context window size
- Cost per 1M tokens (input/output)
- Average response time
- Streaming reliability
- JSON formatting accuracy

**Real-World Performance:**
- How well does it decide when to use tools?
- Does it generate valid JSON consistently?
- Can it handle multiple tools in one turn?
- Does it complete tools before responding?

Rank them for:
1. Production reliability (must work 99%+ of time)
2. Best cost/performance ratio
3. Fastest response time
4. Best for complex agentic workflows

Include any benchmark sources and recent comparisons.
```

---

### Prompt 6: Model + Provider Compatibility Matrix

```
Create a compatibility matrix for LLM models and search providers (December 2025):

Models to test:
- Grok 4.1 Fast
- Gemini 2.0 Flash
- Claude 3.7 Sonnet
- GPT-4o
- DeepSeek V3.2
- DeepSeek Terminus

Search Providers:
- Serper (Google)
- Tavily
- Exa

For each combination, estimate:
1. Tool calling success rate (%)
2. Average response time (seconds)
3. Streaming reliability (excellent/good/fair/poor)
4. Likelihood of timeout issues
5. JSON formatting accuracy

Explain:
- Why certain models work better with certain providers
- Which combinations to avoid
- Which combination is best for:
  * Maximum reliability
  * Best value (cost/performance)
  * Fastest responses
  * Complex multi-turn scenarios

Provide specific evidence or reasoning for each rating.
```

---

### Prompt 7: Budget Model Analysis

```
I need an affordable LLM for tool calling (automatic web search) with acceptable reliability.

Budget constraint: <$10/month for 1000 searches/day with ~500-1000 tokens per interaction.

Analyze these budget options:

1. Gemini 2.0 Flash ($0.075/M input)
2. DeepSeek V3.2 ($0.27/M)
3. DeepSeek Terminus ($0.27/M)
4. Llama 3.3 70B (varies by provider)
5. Qwen 2.5 72B (varies by provider)

For each model:
- Monthly cost estimate (detailed breakdown)
- Tool calling success rate
- Known issues with streaming/tool calling
- Comparison with premium models (Grok, Claude, GPT-4)
- Is the cost savings worth potential reliability issues?

Recommend:
- Best budget option for production
- Which models to avoid despite low cost
- Settings/configurations to improve reliability
- When it's worth paying more for a premium model

Calculate break-even points where reliability loss costs more than model upgrade.
```

---

### Prompt 8: OpenRouter Specifics

```
I'm using OpenRouter to access LLMs for tool calling in December 2025.

Research OpenRouter-specific optimizations:

1. What are ":exacto" endpoints?
   - Which models support them?
   - How much do they improve tool calling?
   - Benchmark data on exacto vs standard endpoints

2. Provider routing and fallbacks:
   - How does OpenRouter route tool calling requests?
   - Which providers are most reliable per model?
   - Fallback strategies for high availability

3. Tool calling accuracy tracking:
   - How does OpenRouter measure tool calling success?
   - Which models/providers have best accuracy?
   - Any public benchmarks or leaderboards?

4. Cost optimization:
   - Does OpenRouter add markup to model prices?
   - Volume discounts or credits available?
   - Hidden costs (retries, failed calls, etc.)

5. Best practices:
   - Recommended models for tool calling on OpenRouter
   - Settings to maximize reliability
   - How to handle rate limits and errors

Include specific model recommendations with OpenRouter and explain why certain models work better through OpenRouter vs direct API access.
```

---

## 🔧 Technical Implementation Prompts

### Prompt 9: Streaming Architecture Deep Dive

```
Explain the technical architecture for reliable streaming with tool calling:

Context: AI chatbot using Server-Sent Events (SSE) for streaming responses. LLM can call search tools mid-stream.

Analyze this flow:
1. User sends message
2. LLM stream starts (thinking phase)
3. LLM decides to call search tool
4. Search API called (takes 1-5 seconds)
5. Results sent back to LLM
6. LLM continues streaming final response

Problems to solve:
- How to keep stream alive during tool execution?
- How to show user what's happening (searching, fetching, etc.)?
- How to handle timeouts gracefully?
- How to prevent "no response" when tools take too long?

Explain:
1. Proper SSE event structure for tool calling phases
2. Client-side state management during tool execution
3. Timeout and retry strategies
4. How to buffer/queue events properly
5. Error recovery patterns

Provide code examples or pseudocode for:
- Server-side streaming with tool calls
- Client-side event parsing
- Phase visualization (thinking → searching → responding)
- Timeout handling

Include best practices from production chatbot implementations.
```

---

### Prompt 10: Error Handling and Reliability

```
Design a robust error handling system for LLM tool calling with web search:

Failure scenarios to handle:

1. **LLM Issues:**
   - Malformed tool call JSON
   - Decides not to use tools when needed
   - Starts responding before tool completes
   - Infinite tool calling loops

2. **Search API Issues:**
   - Timeout (>10s response time)
   - Rate limiting (429 errors)
   - Invalid API key
   - Search returns no results
   - Partial/incomplete data

3. **Streaming Issues:**
   - Connection drops mid-stream
   - Buffer overflow
   - Client loses connection
   - Server crashes during tool execution

For each scenario:
- Detection strategy (how to identify the error)
- Handling approach (retry, fallback, fail gracefully)
- User communication (what to show/tell the user)
- Logging and monitoring (what to track)

Provide:
1. Retry logic with exponential backoff (pseudocode)
2. Circuit breaker pattern for failing search APIs
3. Fallback strategies (multiple search providers, cached results, degraded mode)
4. Timeout configuration recommendations
5. User feedback patterns ("Searching...", "Search taking longer than usual...", "Search failed, continuing without results")

Include production-tested recommendations and common pitfalls to avoid.
```

---

### Prompt 11: Performance Optimization

```
I want to optimize my AI chatbot for fastest possible responses while maintaining reliability.

Current setup:
- OpenRouter API with tool calling enabled
- Automatic web search (Serper/Tavily/Exa)
- Server-Sent Events streaming
- 500-2000 token responses typical

Analyze optimization strategies:

**1. Model Selection:**
- Fastest models for tool calling
- Impact of model size on latency
- Context window optimization (smaller = faster?)

**2. Search Configuration:**
- Optimal result count (3 vs 5 vs 10)
- Parallel vs sequential tool calls
- Caching strategies (when/what to cache)
- Content filtering (what data is essential?)

**3. Streaming Optimization:**
- Event buffering strategies
- Minimize payload sizes
- Progressive rendering
- Client-side optimizations

**4. Infrastructure:**
- Edge deployment (Cloudflare Workers, Vercel Edge)
- CDN for static assets
- Database query optimization
- Connection pooling

Provide:
- Specific configuration recommendations
- Expected performance improvements (X ms → Y ms)
- Trade-offs (speed vs quality, cost vs performance)
- Measurement strategy (what metrics to track)

Goal: Get from search initiation to first token in <2 seconds, complete response in <5 seconds.

Include real-world benchmarks and case studies if available.
```

---

### Prompt 12: Cost Optimization Strategy

```
Design a cost-effective strategy for running an AI chatbot with automatic web search at scale.

Expected usage:
- 10,000 conversations/day
- 20% require web search
- Average 1000 tokens per conversation
- Need 95%+ reliability

Budget goal: <$500/month total (LLM + search costs)

Analyze:

**1. Model Selection:**
- Calculate exact costs for different model tiers
- Where can we use cheaper models without sacrificing quality?
- Mixed model strategy (use cheap models, fallback to expensive for complex queries)

**2. Search Optimization:**
- Minimize unnecessary searches (when can LLM answer without search?)
- Cache search results (what's the hit rate?)
- Batch or deduplicate similar queries
- Free tier maximization

**3. Token Optimization:**
- Prompt engineering for conciseness
- Context window management
- System prompt optimization
- Response length limiting

**4. Architecture:**
- Edge caching
- CDN for static assets
- Database vs in-memory caching
- Async processing for non-critical tasks

Provide:
1. Detailed cost breakdown per component
2. ROI analysis for each optimization
3. Scaling plan (costs at 10k, 50k, 100k conversations/day)
4. Risk analysis (where cutting costs hurts quality)
5. Monitoring strategy (track cost per conversation)

Include specific model + search provider recommendations with exact pricing.
```

---

## 📊 Benchmark & Testing Prompts

### Prompt 13: Creating Test Suite

```
Design a comprehensive test suite for evaluating LLM tool calling with web search:

Test categories:

**1. Tool Calling Accuracy:**
- Does model call tools when appropriate?
- Does it generate valid JSON?
- Multi-turn tool calling
- Parallel tool execution
- Error recovery

**2. Search Quality:**
- Result relevance
- Answer freshness (real-time data)
- Handling "no results" gracefully
- Multi-language support

**3. Streaming Reliability:**
- Connection stability
- Timeout handling
- Phase transitions (thinking → searching → responding)
- Recovery from interruptions

**4. Performance:**
- Time to first token
- Total response time
- Search API latency
- Token throughput

For each category, provide:
- 5-10 specific test cases
- Expected behavior
- Pass/fail criteria
- How to measure/score
- Priority level (critical/important/nice-to-have)

Create test prompts like:
- "What's the Bitcoin price right now?" (tests real-time search)
- "Compare React vs Vue, then recommend one" (tests multi-turn)
- "Search for X and Y in parallel" (tests parallel execution)

Include methodology for:
- Automated testing
- A/B testing different models
- Regression testing after changes
- Performance benchmarking
```

---

### Prompt 14: Production Monitoring

```
Design a monitoring and observability strategy for AI chatbot with tool calling:

Key metrics to track:

**1. Success Rates:**
- Tool calling success rate (% of successful tool calls)
- Search success rate (% returning results)
- End-to-end conversation success
- Error rates by type

**2. Performance:**
- Time to first token (TTFT)
- Total response time
- Search API latency (p50, p95, p99)
- Tokens per second

**3. Quality:**
- User satisfaction (thumbs up/down)
- Tool calling appropriateness (unnecessary searches?)
- Result relevance
- Response coherence

**4. Costs:**
- Cost per conversation
- LLM costs vs search costs
- Cost per successful search
- Budget burn rate

**5. Reliability:**
- Uptime
- Timeout rate
- Retry rate
- Fallback usage

For each metric:
- How to measure
- What tool/service to use (Prometheus, Datadog, etc.)
- Alert thresholds
- Dashboard visualization

Provide:
1. Sample dashboard layout
2. Alert rules (when to notify on-call engineer)
3. SLA targets (what's acceptable vs concerning)
4. Debugging workflow (metric X is bad → check Y → do Z)

Include real-world examples from production chatbots.
```

---

## 💡 Use These Prompts

Copy any prompt above and paste it into:
- ChatGPT (GPT-4 or GPT-4o)
- Claude (Sonnet 3.7)
- Gemini (Pro or Flash)
- DeepSeek
- Any other LLM

You can also:
- Combine prompts for comprehensive analysis
- Modify prompts to be more specific to your use case
- Ask follow-up questions based on responses
- Request code examples or configurations

## 📝 How to Use Effectively

1. **Start broad, then narrow:** Begin with Prompts 1 or 5, then dive into specific areas
2. **Cross-reference:** Ask multiple LLMs the same prompt to compare insights
3. **Request sources:** Always ask for benchmark data, papers, or blog posts
4. **Be specific about date:** Always mention "December 2025" or "as of December 2025"
5. **Ask for evidence:** Request "show benchmark data" or "cite sources"
6. **Iterate:** Use responses to generate better follow-up questions

## 🎯 Pro Tips

- **Gemini 2.0 Flash** is great for research (cheap, fast, good at web search)
- **Claude 3.7 Sonnet** excels at technical analysis and trade-offs
- **ChatGPT** (GPT-4o) is good for practical implementation advice
- **DeepSeek** can be surprisingly insightful despite lower tool calling scores
- **Perplexity** is excellent for prompts requesting recent benchmarks

## 📚 Additional Research

After getting responses, search for:
- "Berkeley Function Calling Leaderboard 2025"
- "OpenRouter tool calling accuracy [model name]"
- "[Search provider] vs [search provider] benchmark 2025"
- "LLM agent performance comparison 2025"
- "Production AI chatbot case study [company name]"

---

## 🎯 BONUS: The Ultimate Automatic Search Reliability Prompt

### Prompt 15: Optimizing Model + Provider for Automatic Search (MOST IMPORTANT)

```
I'm building an AI chatbot where the LLM automatically decides when to search the web (tool calling). The user doesn't explicitly say "search for X" - the AI must detect when current knowledge is insufficient and trigger search autonomously.

Critical requirements:
1. High reliability (95%+ success rate)
2. Fast responses (<3s from search trigger to results)
3. Streaming must not break when search is triggered
4. LLM must consistently return valid tool call JSON
5. LLM must wait for search results before responding
6. Cost-effective for 1000-2000 searches/day

Research the COMBINATION of model + search provider for December 2025:

**Test these combinations:**

Models:
- Grok 4.1 Fast
- Gemini 2.0 Flash
- Claude 3.7 Sonnet
- GPT-4o
- DeepSeek Terminus
- DeepSeek V3.2

Search Providers:
- Serper (Google API)
- Tavily
- Exa

**For each combination, analyze:**

1. **Tool Calling Reliability:**
   - Does the model generate valid JSON consistently?
   - Does it call tools at appropriate times (not too often/rarely)?
   - Can it handle the search provider's response format?
   - Does it complete the tool call before responding?

2. **Streaming Compatibility:**
   - Does the combination work well with Server-Sent Events?
   - Are there timeout issues with slower search providers?
   - Does the stream stay alive during search execution?
   - Any known issues with chunked responses?

3. **Response Quality:**
   - How well does the model integrate search results?
   - Does it cite sources appropriately?
   - Can it synthesize information from multiple results?
   - Does it fall back gracefully if search fails?

4. **Performance:**
   - Average time from tool call to search completion
   - Impact on token generation speed
   - Any latency issues or bottlenecks?

5. **Cost:**
   - Total cost per conversation (model + search)
   - Monthly cost for expected usage
   - Cost vs reliability trade-off

**Provide specific recommendations:**

1. **Best Overall (Reliability + Performance):**
   - Which model + provider combination has highest success rate?
   - What configuration settings optimize reliability?
   - Any OpenRouter `:exacto` endpoints that help?

2. **Best Value (Cost + Performance):**
   - Which combination gives 95%+ reliability at lowest cost?
   - Where can we cut costs without hurting reliability?

3. **Fastest Response:**
   - Which combination gets results fastest?
   - What's the theoretical minimum latency?

4. **Most Reliable with Slow Providers:**
   - If using Exa (3-10s responses), which model handles it best?
   - How to configure timeouts and retries?

**Known Issues to Document:**

- "DeepSeek V3.2 + Exa = 75% success" (from our testing)
- "Grok 4.1 + Serper = 99.5% success" (from our testing)
- Any other known problematic combinations?
- Common failure patterns to avoid?

**Configuration Recommendations:**

For the top 3 combinations, provide exact configuration:

```json
{
  "model": "model-id",
  "searchProvider": "provider",
  "searchSettings": {
    "maxResults": 5,
    // ... other settings
  },
  "modelSettings": {
    "temperature": 0.7,
    "maxTokens": 4096,
    // ... other settings
  },
  "timeouts": {
    "search": 10000,
    "stream": 30000
  }
}
```

**Real-World Scenarios:**

Test these queries and predict success rate:
1. "What's the Bitcoin price right now?"
2. "Compare the latest iPhone vs Samsung flagship"
3. "What are the top AI news stories today?"
4. "Should I invest in Tesla stock?"
5. "What's the weather in Vienna tomorrow?"

For each scenario, explain:
- Which models will trigger search automatically?
- Which search providers return best results?
- Expected response time
- Common failure modes

**Decision Matrix:**

Create a table ranking all combinations by:
- Reliability score (1-10)
- Speed score (1-10)
- Cost score (1-10)
- Overall recommendation (use/avoid)

Include specific evidence, benchmarks, or case studies if available.

**Final Recommendation:**

Based on all analysis, provide THE definitive combination for automatic search in production:
- Exact model ID
- Exact search provider
- Exact configuration settings
- Expected performance metrics
- Monthly cost estimate
- Known limitations

This should be the "set it and forget it" configuration that works reliably.
```

---

## 🔥 Priority Order for Research

If you only have time for a few prompts, do these in order:

1. **Prompt 15** (above) - Most comprehensive for your use case
2. **Prompt 5** - Best models for tool calling
3. **Prompt 3** - Serper vs Tavily comparison
4. **Prompt 6** - Model + provider compatibility matrix
5. **Prompt 8** - OpenRouter optimizations

These five prompts will give you 80% of what you need to make the right decisions.

---

## 🎓 How to Get Best Results

### When asking these prompts:

**1. Always specify the date:**
```
"As of December 2025, what are..."
```

**2. Request evidence:**
```
"Provide benchmark data and sources for..."
```

**3. Ask for specifics:**
```
"Give exact configuration values, not just general advice"
```

**4. Request comparisons:**
```
"Compare X vs Y with a table showing..."
```

**5. Ask for trade-offs:**
```
"Explain the downsides of each option..."
```

### Multi-LLM Strategy:

1. **Ask Gemini 2.0 Flash** - Fast, cheap, good at finding recent info
2. **Verify with Claude 3.7** - Best at analyzing trade-offs
3. **Cross-check with GPT-4o** - Practical implementation details
4. **Use Perplexity** - Verify benchmarks and recent changes

If they all agree, it's probably accurate. If they disagree, dig deeper.

---

Good luck with your research! 🚀
