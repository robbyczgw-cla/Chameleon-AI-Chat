# Unified Visualization Settings System - Proposal

## Overview

This document proposes a unified settings system for all visualization features in Chameleon AI Chat, extending beyond streaming to include response analysis, rich content, analytics, and interactive features.

## Current State

**Scattered Settings:**
- `experimental.enableResponseAnalysis` - Simple boolean toggle
- `experimental.streamingVisualization` - 24+ granular settings
- `showDetailedStats` - Moved to streaming settings
- No controls for: follow-ups, insights, rich content, analytics dashboards

**Missing Controls:**
Users cannot customize:
- Which rich content types to render (Mermaid, math, polls, etc.)
- Analytics dashboard visibility
- Conversation insights generation
- Follow-up suggestions display
- Response analysis detail level

## Proposed Solution

### New Settings Structure

```typescript
export interface UnifiedVisualizationSettings {
  // Response Intelligence
  responseAnalysis?: {
    enabled?: boolean
    showSentiment?: boolean
    showConfidence?: boolean
    showComplexity?: boolean
    showReadingTime?: boolean
    showCitations?: boolean
    showHedgingPhrases?: boolean
    showToneAnalysis?: boolean
  }

  // Interactive Features
  interactiveFeatures?: {
    showFollowUpSuggestions?: boolean
    followUpCategories?: ('quick' | 'deep' | 'related')[]
    showConversationInsights?: boolean
    autoGenerateInsights?: boolean
    insightsMinMessages?: number // default: 2
  }

  // Rich Content Rendering
  richContent?: {
    enableMermaidDiagrams?: boolean
    mermaidFullscreenByDefault?: boolean
    mermaidDownloadButton?: boolean
    enableMathRendering?: boolean
    enableInteractivePolls?: boolean
    enableTimelines?: boolean
    enableProgressBars?: boolean
    enableRichTables?: boolean
    tableSearchEnabled?: boolean
    tableSortingEnabled?: boolean
    enableComparisonCards?: boolean
    enableRichMediaEmbeds?: boolean
    richMediaTypes?: ('youtube' | 'twitter' | 'codepen' | 'spotify' | 'github' | 'figma')[]
  }

  // Analytics & Dashboards
  analytics?: {
    showCostTracker?: boolean
    costTrackerTimeRange?: '7d' | '30d' | 'all'
    showChatAnalytics?: boolean
    showStatsWidget?: boolean
    showPersonalityAnalysis?: boolean
    showContextMeter?: boolean
    contextMeterMode?: 'compact' | 'full' | 'mini'
    autoShowCriticalContext?: boolean
  }

  // File & Media Previews
  previews?: {
    enableInlineFilePreviews?: boolean
    enableImagePreviews?: boolean
    maxPreviewSize?: number // KB
    supportedFileTypes?: string[]
  }

  // Performance & Optimization
  performance?: {
    lazyLoadDiagrams?: boolean
    debounceRenderingMs?: number // default: 300
    maxVisibleAnalyticsCards?: number
    disableAnimations?: boolean
  }
}
```

### Quick Presets

```typescript
const VISUALIZATION_PRESETS = {
  minimal: {
    // Essential features only
    responseAnalysis: { enabled: false },
    interactiveFeatures: {
      showFollowUpSuggestions: true,
      showConversationInsights: false
    },
    richContent: {
      enableMermaidDiagrams: true,
      enableMathRendering: true,
      // Most interactive features disabled
    },
    analytics: {
      showContextMeter: true,
      contextMeterMode: 'mini'
    }
  },

  balanced: {
    // Recommended for most users
    responseAnalysis: {
      enabled: true,
      showSentiment: true,
      showConfidence: true,
      showComplexity: true,
      showReadingTime: true
    },
    interactiveFeatures: {
      showFollowUpSuggestions: true,
      showConversationInsights: true,
      autoGenerateInsights: true
    },
    richContent: {
      // All enabled except heavy embeds
      enableMermaidDiagrams: true,
      enableMathRendering: true,
      enableInteractivePolls: true,
      enableRichTables: true,
      enableRichMediaEmbeds: false // Performance consideration
    },
    analytics: {
      showCostTracker: true,
      showStatsWidget: true,
      showContextMeter: true,
      contextMeterMode: 'compact'
    }
  },

  maximum: {
    // Everything enabled - full transparency
    // All features set to true with most permissive options
  }
}
```

## Implementation Plan

### Phase 1: Settings Infrastructure
1. Add `UnifiedVisualizationSettings` interface to `types/index.ts`
2. Create `components/visualization-settings-panel.tsx` (similar to streaming-settings-panel)
3. Add to `experimental-settings.tsx` below streaming visualization
4. Implement preset buttons and category organization

### Phase 2: Component Integration
Update each visualization component to check settings:

```typescript
// In response-analysis-panel.tsx
const { settings } = useApp()
const vizSettings = settings?.experimental?.unifiedVisualization?.responseAnalysis

if (!vizSettings?.enabled) return null

return (
  <div className="response-analysis">
    {vizSettings?.showSentiment !== false && <SentimentDisplay />}
    {vizSettings?.showConfidence !== false && <ConfidenceDisplay />}
    {vizSettings?.showComplexity !== false && <ComplexityDisplay />}
    {vizSettings?.showToneAnalysis !== false && <ToneDisplay />}
  </div>
)
```

### Phase 3: Performance Optimization
1. Implement lazy loading for heavy components (Mermaid, rich media)
2. Add debouncing controls for real-time rendering
3. Implement max visible limits for analytics cards
4. Add animation disable option for low-end devices

### Phase 4: User Experience
1. Add tooltips explaining each setting
2. Implement export/import settings
3. Add "Reset to defaults" per category
4. Show preview/demo of what each setting affects

## Benefits

### For Users
1. **Full Control**: Granular control over every visualization feature
2. **Performance**: Disable expensive features on low-end devices
3. **Focus**: Reduce visual clutter for specific workflows
4. **Privacy**: Disable analytics/tracking features
5. **Accessibility**: Disable animations, adjust contrast, simplify UI

### For Developers
1. **Consistency**: Unified pattern for all visualization settings
2. **Discoverability**: All features in one place with descriptions
3. **Extensibility**: Easy to add new visualization features
4. **Maintainability**: Single source of truth for all viz toggles
5. **Performance Monitoring**: Track which features impact performance

## UI Design

### Settings Panel Layout

```
╔══════════════════════════════════════════════════════════╗
║  🎨 Advanced Visualization                               ║
║                                                          ║
║  Quick Presets: [Minimal] [Balanced] [Maximum]          ║
║                                                          ║
║  ───────────────────────────────────────────────────    ║
║                                                          ║
║  📊 Response Intelligence                                ║
║    ☑ Enable Response Analysis                           ║
║    ☑ Show Sentiment                                      ║
║    ☑ Show Confidence Level                              ║
║    ☑ Show Complexity Score                              ║
║    ☑ Show Reading Time                                  ║
║    ☑ Show Citation Count                                ║
║    ☑ Show Tone Analysis                                 ║
║                                                          ║
║  ───────────────────────────────────────────────────    ║
║                                                          ║
║  💬 Interactive Features                                 ║
║    ☑ Show Follow-Up Suggestions                         ║
║        Follow-up categories:                             ║
║        [✓] Quick  [✓] Deep  [✓] Related                 ║
║    ☑ Show Conversation Insights                         ║
║    ☑ Auto-Generate Insights                             ║
║        Minimum messages: [2] ───────────                ║
║                                                          ║
║  ───────────────────────────────────────────────────    ║
║                                                          ║
║  🎭 Rich Content Rendering                               ║
║    ☑ Enable Mermaid Diagrams                            ║
║      ☑ Fullscreen button                                ║
║      ☑ Download as SVG                                  ║
║    ☑ Enable Math Rendering (KaTeX)                      ║
║    ☑ Enable Interactive Polls                           ║
║    ☑ Enable Timelines                                   ║
║    ☑ Enable Progress Bars                               ║
║    ☑ Enable Rich Tables                                 ║
║      ☑ Search functionality                             ║
║      ☑ Column sorting                                   ║
║    ☑ Enable Comparison Cards                            ║
║    ☐ Enable Rich Media Embeds                           ║
║        Enabled services:                                 ║
║        [✓] YouTube  [✓] Twitter  [ ] Spotify            ║
║        [✓] GitHub   [ ] Figma    [ ] CodePen            ║
║                                                          ║
║  ───────────────────────────────────────────────────    ║
║                                                          ║
║  📈 Analytics & Dashboards                               ║
║    ☑ Show Cost Tracker                                  ║
║        Default time range: [30 days ▼]                  ║
║    ☑ Show Chat Analytics                                ║
║    ☑ Show Usage Statistics Widget                       ║
║    ☑ Show Personality Analysis                          ║
║    ☑ Show Context Window Meter                          ║
║        Display mode: [Compact ▼]                        ║
║    ☑ Auto-show on critical context (>90%)               ║
║                                                          ║
║  ───────────────────────────────────────────────────    ║
║                                                          ║
║  📎 File & Media Previews                                ║
║    ☑ Enable Inline File Previews                        ║
║    ☑ Enable Image Previews                              ║
║        Max preview size: [5 MB] ─────────               ║
║                                                          ║
║  ───────────────────────────────────────────────────    ║
║                                                          ║
║  ⚡ Performance & Optimization                           ║
║    ☑ Lazy load diagrams (render on scroll)              ║
║    ☑ Debounce rendering (300ms default)                 ║
║    ☑ Limit visible analytics cards (10 max)             ║
║    ☐ Disable animations (performance mode)              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

## Example Usage

### Before (Scattered)
```typescript
// In settings context
const [enableResponseAnalysis, setEnableResponseAnalysis] = useState(false)

// In component
if (!enableResponseAnalysis) return null
```

### After (Unified)
```typescript
// In settings context - single object
const unifiedVisualization = settings?.experimental?.unifiedVisualization || {}

// In component - consistent pattern
const vizSettings = unifiedVisualization.responseAnalysis || {}
if (!vizSettings.enabled) return null

return (
  <div>
    {vizSettings.showSentiment !== false && <Sentiment />}
    {vizSettings.showConfidence !== false && <Confidence />}
    {vizSettings.showToneAnalysis !== false && <Tone />}
  </div>
)
```

## Migration Strategy

### Backward Compatibility
```typescript
// Support old settings during transition
const responseAnalysisEnabled =
  settings?.experimental?.unifiedVisualization?.responseAnalysis?.enabled
  ?? settings?.experimental?.enableResponseAnalysis
  ?? true // default
```

### Deprecation Plan
1. **Version N**: Add unified settings, maintain old settings
2. **Version N+1**: Show deprecation warning in console
3. **Version N+2**: Auto-migrate old settings to new structure
4. **Version N+3**: Remove old settings entirely

## Performance Considerations

### Lazy Loading Strategy
```typescript
// Load heavy components only when needed
const MermaidDiagram = lazy(() => import('./mermaid-diagram'))
const RichMediaEmbed = lazy(() => import('./rich-media-renderer'))

// Render with Suspense
{vizSettings.enableMermaidDiagrams && (
  <Suspense fallback={<DiagramSkeleton />}>
    <MermaidDiagram code={code} />
  </Suspense>
)}
```

### Debouncing Strategy
```typescript
// Prevent excessive re-renders during streaming
const debouncedRenderDiagram = useMemo(
  () => debounce(renderDiagram, vizSettings.performance?.debounceRenderingMs || 300),
  [vizSettings.performance?.debounceRenderingMs]
)
```

### Analytics Limits
```typescript
// Limit visible analytics cards
const maxCards = vizSettings.analytics?.maxVisibleAnalyticsCards || 10
const visibleAnalytics = analyticsData.slice(0, maxCards)
```

## Testing Strategy

### Unit Tests
- Test each setting toggle affects correct components
- Verify preset application
- Check default values fallback correctly

### Integration Tests
- Test settings persistence across sessions
- Verify migration from old to new settings
- Check performance impact with/without features

### E2E Tests
- User flow: Apply preset → verify UI changes
- User flow: Toggle individual settings → verify behavior
- User flow: Export settings → import on new device

## Documentation Requirements

1. **User Documentation**
   - What each setting does (with screenshots)
   - Recommended presets for different use cases
   - Performance impact guide
   - Troubleshooting common issues

2. **Developer Documentation**
   - How to add new visualization features
   - How to integrate settings checks
   - Performance best practices
   - Testing guidelines

## Future Enhancements

### Potential Additions (Version 2)

1. **Per-Conversation Overrides**
   - Allow temporary visualization settings per chat
   - "Focus mode" - minimal viz for specific tasks
   - "Debug mode" - maximum viz for troubleshooting

2. **Smart Presets**
   - Auto-detect device capability
   - Suggest optimal settings based on usage patterns
   - "Mobile mode" vs "Desktop mode" presets

3. **Collaborative Settings**
   - Share visualization configurations
   - Community presets marketplace
   - Export/import preset bundles

4. **A/B Testing Integration**
   - Track which visualizations users actually use
   - Measure performance impact
   - Optimize default settings based on data

5. **Accessibility Profiles**
   - High contrast mode
   - Screen reader optimized
   - Reduced motion mode
   - Dyslexia-friendly fonts

## Conclusion

This unified visualization settings system provides:

✅ **Consistency** - One pattern for all viz features
✅ **Discoverability** - All settings in one place
✅ **Control** - Granular per-feature toggles
✅ **Performance** - Optimize for device capabilities
✅ **Extensibility** - Easy to add new features
✅ **User Experience** - Quick presets + advanced customization

The system builds on the successful pattern established by the streaming visualization settings, extending it to cover the entire application's rich visualization ecosystem.

---

**Next Steps:**
1. Review and approve this proposal
2. Prioritize features for Phase 1
3. Create implementation tickets
4. Begin development with settings infrastructure
5. Iterate based on user feedback
