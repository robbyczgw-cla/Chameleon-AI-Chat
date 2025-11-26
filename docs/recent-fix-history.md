# Recent Fix History (Last Two Commits)

## Why These Fixes Were Needed
- The Simple Mode layouts diverged from Advanced Mode after a sidebar wrapper refactor, leaving the welcome screen and chat inputs too narrow and causing dialog cutoffs in settings and the pet companion flows.
- A prior attempt to reduce GPU usage by stripping blur and blend effects broke the intended glassmorphic visual design, so we had to reintroduce the styling while still offering a lighter alternative for sensitive devices.

## Commit 461a446 (Merge PR #75: Revert GPU Style Removal)
- Re-applied the blur, blend, and halo layers in `app/globals.css` so both modes retained their original look after the performance-focused revert was rolled back.
- Preserved the updated color tokens and layout variables from main while keeping the visual treatments intact, preventing further conflicts between the branches.
- Context: This merge restored the visual baseline, ensuring subsequent layout work targeted the correct design language rather than the stripped-down fallback.

## Commit d088e81 (Fix Pet Companion Dialog Layout)
- Widened the adoption dialog (`components/pet-companion.tsx`) with responsive grids and explicit width constraints so pet selection, personality cards, and naming inputs no longer collapse or clip.
- Aligned the Simple Mode shell (`components/simple-chat-app.tsx`) and settings dialog (`components/simple-settings-dialog.tsx`) with the Advanced Mode flex behavior, eliminating the narrow-column issue on desktop after the sidebar wrapper change.
- Added a reduced-motion fallback in `app/globals.css` that softens blur and blend filters for users who prefer lighter effects, addressing GPU concerns without removing the design elements entirely.

## How Conflicts Were Resolved
- Pulled main via the merge commit to reintroduce the shared CSS effects, then adjusted the Simple Mode components on top of that baseline so class name and layout changes matched main’s structure.
- Verified the dialog and shell widths by mirroring the Advanced Mode patterns (e.g., non-shrinking main panel, max-width constraints on dialogs) to keep future merges conflict-free.
