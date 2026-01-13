# Icon Migration: Lucide to Phosphor

This document provides a reference for the icon migration from Lucide Icons to Phosphor Icons.

## Overview

Chameleon AI Chat migrated from [Lucide Icons](https://lucide.dev) to [Phosphor Icons](https://phosphoricons.com) to achieve a more distinctive visual identity. Lucide, while excellent, has become the default choice for many AI-generated UIs and modern web apps, leading to visual homogeneity.

## Why Phosphor?

| Feature | Lucide | Phosphor |
|---------|--------|----------|
| **Icons** | 1,500+ | 9,000+ |
| **Styles** | Stroke only | 6 weights (thin, light, regular, bold, fill, duotone) |
| **License** | MIT | MIT |
| **Bundle** | Tree-shakable | Tree-shakable |
| **React Support** | Yes | Yes |

The duotone style in particular gives Chameleon a more polished, distinctive look compared to the ubiquitous stroke-only icons.

## Usage

```tsx
// Import icons
import { Brain, Sparkle, Lightning } from "@phosphor-icons/react"

// Basic usage
<Brain className="h-5 w-5" />

// With weight (duotone, bold, light, etc.)
<Sparkle weight="duotone" className="h-6 w-6 text-orange-500" />

// With custom color
<Lightning weight="bold" className="h-4 w-4 text-yellow-500" />
```

## Icon Mapping Reference

Below is the complete mapping from Lucide icons to their Phosphor equivalents:

### Alert & Status Icons
| Lucide | Phosphor |
|--------|----------|
| AlertCircle | WarningCircle |
| AlertTriangle | Warning |
| CheckCircle2 | CheckCircle |
| XCircle | XCircle |
| Info | Info |

### Arrow & Navigation Icons
| Lucide | Phosphor |
|--------|----------|
| ArrowDown | ArrowDown |
| ArrowRight | ArrowRight |
| ArrowUp | ArrowUp |
| ArrowUpDown | ArrowsDownUp |
| ChevronDown | CaretDown |
| ChevronRight | CaretRight |
| ChevronLeft | CaretLeft |
| ChevronUp | CaretUp |
| ExternalLink | ArrowSquareOut |

### Action Icons
| Lucide | Phosphor |
|--------|----------|
| Check | Check |
| X | X |
| Plus | Plus |
| Copy | Copy |
| Download | Download |
| Upload | Upload |
| Edit / Edit2 | PencilSimple |
| Pencil | Pencil |
| Trash2 | Trash |
| Save | FloppyDisk |
| RefreshCw | ArrowsClockwise |
| RotateCcw | ArrowCounterClockwise |
| Search | MagnifyingGlass |
| Send | PaperPlaneRight |
| Share2 | ShareNetwork |
| Pin | PushPin |
| Link | Link |
| Link2 | LinkSimple |
| Maximize2 | ArrowsOut |
| Shrink | ArrowsIn |
| ZoomIn | MagnifyingGlassPlus |
| ZoomOut | MagnifyingGlassMinus |

### UI Icons
| Lucide | Phosphor |
|--------|----------|
| Menu | List |
| MoreHorizontal | DotsThree |
| MoreVertical | DotsThreeVertical |
| Settings | Gear |
| Settings2 | GearSix |
| Sliders | Sliders |
| Grid2x2 | GridFour |
| LayoutGrid | GridNine |
| Eye | Eye |
| Keyboard | Keyboard |
| Gauge | Gauge |
| Home | House |
| PanelLeft | Sidebar |
| PanelLeftClose | SidebarSimple |

### Shape Icons
| Lucide | Phosphor |
|--------|----------|
| Circle | Circle |
| Square | Square |
| Star | Star |
| Heart | Heart |

### File Icons
| Lucide | Phosphor |
|--------|----------|
| FileText | FileText |
| FileCode / FileJson | FileCode |
| FileImage | Image |
| FileIcon | File |
| FileSearch | FileMagnifyingGlass |
| Folder | Folder |
| FolderOpen | FolderOpen |
| FolderPlus | FolderPlus |

### Media Icons
| Lucide | Phosphor |
|--------|----------|
| Image / ImageIcon | Image |
| ImagePlus | ImageSquare |
| Camera | Camera |
| Mic | Microphone |
| MicOff | MicrophoneSlash |
| Volume2 | SpeakerHigh |
| VolumeX | SpeakerSlash |
| Youtube | YoutubeLogo |
| Video | VideoCamera |
| Play | Play |
| Music | MusicNote |

### Communication Icons
| Lucide | Phosphor |
|--------|----------|
| MessageSquare | Chat |
| MessageCircle | ChatCircle |
| MessageSquarePlus | ChatDots |
| Quote | Quotes |

### User Icons
| Lucide | Phosphor |
|--------|----------|
| User | User |
| Users | Users |
| LogOut | SignOut |
| Lock | Lock |
| Key | Key |
| Shield | Shield |
| ShieldCheck | ShieldCheck |
| ShieldOff | ShieldSlash |

### Tech & AI Icons
| Lucide | Phosphor |
|--------|----------|
| Brain | Brain |
| Bot | Robot |
| Cpu | Cpu |
| Code2 | Code |
| Network | Graph |
| Globe | Globe |
| Monitor | Monitor |
| Terminal | Terminal |
| Database | Database |
| Server | HardDrives |
| Zap | Lightning |
| Sparkles | Sparkle |
| Lightbulb | Lightbulb |
| FlaskRound | Flask |
| Puzzle | PuzzlePiece |
| Wrench | Wrench |
| Bug | Bug |
| Wand2 | MagicWand |

### Business Icons
| Lucide | Phosphor |
|--------|----------|
| Briefcase | Briefcase |
| DollarSign | CurrencyDollar |
| Coins | Coins |
| Scale | Scales |
| TrendingUp | TrendUp |
| BarChart2 / BarChart3 | ChartBar |
| LineChart | ChartLine |
| Target | Target |
| Trophy | Trophy |
| Award | Medal |

### Time & Calendar Icons
| Lucide | Phosphor |
|--------|----------|
| Clock | Clock |
| Timer | Timer |
| Calendar | Calendar |
| History | ClockCounterClockwise |

### Miscellaneous Icons
| Lucide | Phosphor |
|--------|----------|
| MapPin | MapPin |
| GitBranch | GitBranch |
| Flame | Fire |
| CloudSun | CloudSun |
| Cloud | Cloud |
| Sun | Sun |
| Moon | Moon |
| BookOpen | BookOpen |
| BookTemplate | BookBookmark |
| Type | TextT |
| Palette | Palette |
| Loader2 | CircleNotch |
| HelpCircle | Question |
| Swords | Sword |
| Archive | Archive |
| Paperclip | Paperclip |
| CheckSquare | CheckSquare |
| Activity | Pulse |

## Styling with Weights

Phosphor icons support 6 different weights for visual hierarchy:

```tsx
// Thin - Very light, subtle icons
<Brain weight="thin" />

// Light - Slightly heavier than thin
<Brain weight="light" />

// Regular - Default weight (same as Lucide stroke)
<Brain weight="regular" />

// Bold - Heavier stroke, more prominent
<Brain weight="bold" />

// Fill - Solid filled icons
<Brain weight="fill" />

// Duotone - Two-tone icons with depth
<Brain weight="duotone" />
```

### Recommended Usage
- **Duotone**: Feature icons, hero sections, marketing
- **Bold**: Primary actions, CTAs
- **Regular**: Standard UI elements
- **Light**: Secondary/tertiary elements
- **Fill**: Active states, selected items

## Notes for Contributors

1. **Always use Phosphor icons** - Do not add Lucide back to the project
2. **Check the mapping** - Before adding a new icon, check if it exists in Phosphor
3. **Use weights wisely** - Maintain visual hierarchy with appropriate weights
4. **Tree-shaking** - Import icons individually, not the entire library

```tsx
// Good - Tree-shakable
import { Brain, Sparkle } from "@phosphor-icons/react"

// Bad - Imports entire library
import * as PhosphorIcons from "@phosphor-icons/react"
```

## Resources

- [Phosphor Icons Website](https://phosphoricons.com)
- [Phosphor React Package](https://www.npmjs.com/package/@phosphor-icons/react)
- [Phosphor GitHub](https://github.com/phosphor-icons/react)
