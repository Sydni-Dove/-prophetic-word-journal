# Prophetic Word Generator — Architecture

## 1. OVERVIEW

The Prophetic Word Generator converts uploaded files, pasted notes, or manual form input into structured prophetic journal entries, then routes those entries through a staged UI:

`Form -> Review -> Print`

High-level flow:

- Form collects or autofills entry data.
- Review renders card-based confirmation from structured entries.
- Print renders paginated journal pages and exposes print-specific layout/theme controls.
- Saved entries are accessed through the primary shell tab system rather than the Form -> Review -> Print stage flow.

## 2. SHELL ARCHITECTURE

### A. ACTIVE SHELL PATTERN

- The active Prophetic shell follows the Dream-aligned generator pattern:
  - `gen-nav`
  - `auth-bar`
  - primary `m-tab-nav`
  - stage content / saved-entry content below the primary tab bar
- `m-tab-nav` is the primary visible navigation under the auth bar.
- The visible `1-2-3` stage-flow / stepper shell is not part of the intended architecture.
- Review, Print, and Saved remain structurally separate, but Saved is entered through the primary tab system.

### B. LEGACY COMPATIBILITY LAYER

- The old `Generator / My Saved Entries` top tab layer remains in the DOM only as a hidden compatibility layer for existing JS references.
- That legacy tab layer is not intended to be user-visible navigation.
- Shell behavior should not be rebuilt around the old visible two-tab layout.

### C. SAVED SECTION IN THE SHELL

- The Saved section is opened through the primary `m-tab-nav`.
- Saved search and export controls live inside the saved section.
- Saved export logic is local to the Prophetic generator and does not rely on shared external export utilities.
- Saved entry cards are the load interaction:
  - clicking a card loads the entry into the Review stage (not the Form)
  - form fields are also populated during load so "Back to Form" works for editing
  - `pendingReviewData` is populated via `showReview([mapped])` before stage switch — required for `switchStage` to route to Review
  - there is no separate `Load` button on each card
  - `Delete` remains a separate action and must not trigger card load

## 3. CORE ARCHITECTURE

### A. INPUT / FORM LAYER

- Primary entry points:
  - `handleUpload()`
  - `handlePasteAutofill()`
  - direct field editing in the Form stage
- Upload path reads files via `readFile()`, then routes text through:
  - `parseEntries()` for multi-entry detection
  - `extractData()` for structured field extraction
- Paste autofill is immediate and does not require clicking Generate:
  - `pasteNotes` input triggers `handlePasteAutofill()`
  - debounced `populate(pasted)` runs after 250ms
- Single-file upload can auto-populate and auto-generate:
  - `populate(combined)`
  - `generateFromForm()` after a short delay
- Multi-entry upload does not auto-generate print pages:
  - structured entries are staged in `pendingPages`
  - user still confirms via Generate
- Form layer owns input state only.
- Form layer does not paginate or render print pages.

### B. REVIEW LAYER

- Review source of truth:
  - `pendingReviewData`
- `pendingReviewData` is an array of structured entry objects waiting for print rendering.
- Review entry point:
  - `showReview(dataArray)`
- `showReview()` responsibilities:
  - writes `pendingReviewData`
  - mirrors into `lastGeneratedData`
  - clears and repopulates `#reviewCardsContainer`
  - routes stage to `review`
- Card renderer:
  - `buildReviewCard(data, index, total)`
- Review cards are DOM-only summaries of already parsed data.
- Review does not mutate parser output.
- Review is separated from form and print pagination:
  - form editing remains in the Form stage
  - print pages are not built here
  - `showPages()` is deferred until `handleContinueToPrint()`

### C. PRINT LAYER

- Print entry is stage-driven:
  - `switchStage('print')`
- Print visibility is controlled by:
  - `printHeader`
  - `printSettingsPanel`
  - `previewVp`
  - `printActionBar`
- `switchStage()` sets:
  - `printHeader.hidden = !isPrint`
  - `printSettingsPanel.hidden = !isPrint`
  - `previewVp.hidden = !isPrint`
- Print settings open/close behavior is stage-scoped:
  - `togglePrintSettings(isPrint)`
  - entering Print opens settings
  - leaving Print collapses settings
- Print generation path:
  - Review data in `pendingReviewData`
  - `handleContinueToPrint()`
  - `showPages(pendingReviewData)`
- Print preview is the source of truth for final output:
  - paginated sheets are rendered into `#pagesContainer`
  - print/export uses the same generated page DOM

### D. THEME SYSTEM

- UI surface:
  - `.theme-presets`
  - `.preset-btn`
- Theme selection is Print-stage only.
- Theme state source:
  - `currentTheme`
  - `PRESETS`
- Theme application path:
  - `handleThemePresetChange()`
  - `applyPreset(key)`
  - `applyCustomColors()`
  - `rerenderGeneratedOutput('print')`
- Theme values are stored as CSS variables:
  - `--pg-primary`
  - `--pg-primary-rgb`
  - `--pg-text`
  - `--pg-accent`
  - `--pg-panel`
  - `--pg-decor`
  - `--pg-bg`
- Active/inactive state is class-based:
  - `.preset-btn.active`
  - inactive buttons rely on base `.preset-btn`
- Current implementation note:
  - page colors are token-driven through CSS variables
  - preset buttons still include inline `--preset-color` values in markup, so full no-inline-styling cleanup is not complete

### E. VISIBILITY SYSTEM

- Stage visibility uses the native `.hidden` attribute.
- UI enforcement depends on CSS overrides because base display rules can outrank UA `[hidden]` behavior.
- Required CSS guards currently include:
  - `.stage-action-bar[hidden]`
  - `.review-stage-header[hidden]`
  - `.print-stage-header[hidden]`
  - `.print-settings-panel[hidden]`
  - `.review-cards-container[hidden]`
  - `.review-entry-nav[hidden]`
  - `.preview-viewport[hidden]`
- `switchStage()` is the main stage visibility controller.
- Visibility logic is stage-based, not route-based.

## 4. DATA FLOW

User Input  
-> Structured Data (`extractData`, `parseEntries`, form fields)  
-> Review Cards (`pendingReviewData`, `buildReviewCard`)  
-> Final Print Pages (`showPages`, paginated sheets in `#pagesContainer`)

## 5. CURRENT KNOWN ISSUES

- Mobile access issue:
  - no hardcoded localhost URL is used for navigation
  - image/OCR flow can still fail from phone or local-network origins due to Edge Function network/CORS/preflight behavior
  - current diagnostics use `isLocalNetworkHost(window.location.hostname)` to detect this failure mode
- Theme preset sizing inconsistencies:
  - preset sizing was reduced, but multiple breakpoint-specific overrides still exist
  - visual weight should be rechecked across desktop and mobile
- Form layout measurement issues:
  - Form shell alignment depends on several independent padding rules (`.editor-section`, `.gen-nav`, `.stage-panel`, mobile overrides)
  - spacing drift is still possible when shell rules change
- Print settings collapse vs auto-expand behavior:
  - current behavior is controlled inside `switchStage()` through `togglePrintSettings(isPrint)`
  - this is correct for current UX, but easy to regress if Print visibility logic is refactored separately

## 6. DESIGN + UI CONSTRAINTS

- Must follow Dove Expressions design system.
- Primary form container width is approximately `820px`.
- Mobile-first spacing rules live in breakpoint overrides and must stay consistent with the shared generator shell.
- Print layout must remain isolated from UI containers:
  - editor shell spacing must not alter page dimensions
  - print pages render inside dedicated journal-sheet/page containers

## 7. NON-NEGOTIABLE RULES

- Parser output is final.
- Pagination does not modify content.
- Rendering does not reinterpret data.
- No cross-layer hacks.

## 8. RECENT FIXES (CHANGE SUMMARY)

- Theme preset button resizing:
  - reduced preset controls from heavier card-style buttons to smaller pill-style controls
- Mobile spacing adjustments:
  - normalized nav, editor, stage-panel, and action-bar horizontal padding
- Editor container width fixes:
  - aligned Form shell back to the shared `~820px` container rhythm
- Print settings toggle behavior:
  - entering Print now auto-opens settings
  - leaving Print collapses settings
- Shell restoration:
  - restored the Dream-aligned shell with `m-tab-nav` as the primary visible nav under the auth bar
  - removed the visible legacy `1-2-3` stepper shell
  - kept the legacy `Generator / My Saved Entries` tab layer only as hidden JS compatibility
- Saved-entry UX restoration:
  - saved cards now load on card click
  - the separate `Load` button was removed
  - saved search remains in the saved section
  - saved exports remain inline in the saved section
  - saved exports use local Prophetic export helpers instead of shared external utils
- Saved-entry load flow update (2026-04-23):
  - card click now routes to Review stage instead of Form
  - form fields still populated during load so "Back to Form" remains functional
  - `showReview([mapped])` populates `pendingReviewData` before stage switch
- Review stage header centering fix (2026-04-23):
  - removed `.review-stage-header` from `.stage-panel.*` joint selector that overrode centering
  - review header now aligns to `var(--workspace-stage-max)` like review cards
  - `.stage-panel.print-stage-header` and `.stage-panel.print-settings-panel` remain full-width
- Review stage spacing alignment (2026-04-23):
  - header gap and bottom padding matched to Dream generator rhythm
  - card style flattened to Dream's pale-pink border, no shadow
