# Prophetic Word Generator Changelog

## 2026-04-23 — Review Stage Alignment + Saved Entry Flow

### Review Stage Header — Centering Fix
- removed `.review-stage-header` from the `.stage-panel.review-stage-header` joint selector that was forcing `max-width: none; margin: 0` and overriding the centered layout
- review header now centers at `var(--workspace-stage-max)` (1100px) matching Dream generator
- header eyebrow / title / subtitle block now aligns to the same left edge as review cards

### Review Stage Header — Spacing Alignment with Dream
- increased `.review-stage-header` flex gap from `0.9rem` to `1.4rem` (title block → filter pills, matches Dream's `.review-header { margin-bottom: 1.4rem }`)
- increased `.review-stage-header` bottom padding from `0.6rem` to `1rem` (filter pills → first card, matches Dream's `.review-entry-nav { margin-bottom: 1rem }`)
- removed `.review-stage-head` `margin-bottom: 0.2rem` that was double-spacing the title block
- bumped `.review-stage-title` from `1.2rem` to `1.35rem` (matches Dream)
- removed banner treatment from `.review-stage-header` (background, border-bottom, shadow) — header is now transparent

### Review Cards — Dream Visual Alignment
- flattened review card style to match Dream: `1px solid var(--pale-pink)` border, `border-radius: 0.75rem`, no box-shadow
- reduced card padding from `1.65rem 1.9rem 1.5rem` to `1rem 1.1rem 1.1rem` (matches Dream)
- reduced review card gap from `1.6rem` to `0.9rem` (matches Dream)
- added hover border transition on cards (`border-color: rgba(99,0,0,0.22)`)
- added `body[data-generator-stage="review"]` scoped rule to neutralize the beige output background in Review stage only

### Saved Entry Load Flow
- clicking a saved entry card now routes to Review stage instead of Form
- `loadEntryIntoForm()` now calls `showReview([mapped])` after populating form fields
- `pendingReviewData` is correctly populated before stage switch, preventing `switchStage` from demoting back to Form
- form fields are still populated so "Back to Form" remains functional for editing

### Not Touched
- parser logic
- pagination
- print stage and print settings
- saved search, export, and delete behavior
- card content structure
- mobile nav

---

## 2026-04-23

### Shell Architecture Restoration
- restored the Dream-aligned Prophetic shell as the active UI structure
- kept `gen-nav` and `auth-bar` in place
- set the 4-tab `m-tab-nav` as the primary visible navigation under the auth bar
- removed the visible legacy `1-2-3` stage-flow / stepper shell
- kept the old `Generator / My Saved Entries` tab layer only as a hidden compatibility layer for existing JS references
- preserved the Form, Review, Print, and Saved separation within the restored shell

### Saved Entries UX
- saved entry cards now load entries directly when the card is clicked
- removed the separate `Load` button from each saved card
- kept `Delete` as the only card action button, without triggering card load
- kept saved-entry search in the saved section
- kept saved exports inline in the saved section
- saved exports now respect the active saved-entry search filter

### Export Layer
- removed the broken shared `journal-export-utils.js` dependency from the Prophetic generator
- inlined saved-entry export helpers directly into the Prophetic generator file
- kept saved export options for Excel, Copy, and Word
- stabilized Excel export with a browser-safe binary export path instead of stale shared export logic

### Notes
- localhost had been serving an older Prophetic file during this restoration
- Vercel provided the newer visual baseline, but final shell restoration was aligned to project docs rather than the old localhost copy

## 2026-04-15

### Improvements
- widened the desktop workspace shell for the Prophetic Word Generator
- expanded settings, review, and preview stages so the generator feels less boxed in on desktop
- widened review cards and stage containers while keeping centered margins and padding

### Notes
- printable page preview sizing remains unchanged
- only the surrounding workspace shell was widened

---

## [Update] Prophetic Generator — UI System Alignment with Dream Generator

### Changed
- Replaced stepper-based stage navigation with tab-based system (`m-tab-nav`)
- Moved stage navigation to primary position under auth bar
- Flattened Review and Print stage headers to match Dream generator hierarchy
- Converted Print settings into integrated collapsible panel (no longer accordion group)

### Added
- Auto-expand behavior for Print settings when entering Print stage
- Print page-count badge synced with generated content

### Updated
- Theme preset UI reduced from large grid-style controls to compact pill buttons
- Mobile spacing system normalized (editor shell, stage panels, nav padding)
- Bottom mobile navigation aligned with Dream generator behavior

### Removed
- Legacy stepper navigation system
- Redundant `stageFlowNav` JS logic

### Notes
- This update aligns Prophetic Generator UI/UX with Dream Generator as the source-of-truth pattern
- No parser, pagination, or rendering logic was modified in this pass

---

## Mobile Navigation Refactor — Bottom Tab Bar (Form / Review / Print / Saved)

**Summary:**  
Replaced top stepper-based navigation with a fixed mobile bottom tab bar to match Dream Generator UX.

**Root Issue:**  
Mobile experience behaved like a responsive desktop layout instead of a true app-like tab system.

**Scope:**  
UI Layer only

**Key Changes:**  
- Added `.m-tab-nav` fixed bottom navigation  
- Implemented 4 tabs: Form, Review, Print, Saved  
- Added icon-based buttons (pencil, eye, printer, bookmark)  
- Introduced `switchMobileTab()` to bridge to existing `switchStage()` and `switchTab()`  
- Added active state via `is-active` class with border-bottom indicator  
- Applied safe-area padding for mobile devices  
- Added editor bottom padding: `calc(84px + env(safe-area-inset-bottom))`  

**Not Touched:**  
- Parser  
- Pagination  
- Rendering  
- Print logic  

---

## Mobile Form Action System — Inline CTA (Dream Alignment)

**Summary:**  
Replaced floating mobile action bar with inline form action row consistent with Dream Generator.

**Root Issue:**  
Floating bar created visual weight, overlap issues, and inconsistency with Dream UX.

**Scope:**  
UI Layer

**Key Changes:**  
- Removed reliance on `.mobile-form-bar` for primary actions  
- Restored `.form-action-row` inline under input sections  
- Ensured Clear + Continue to Review buttons are primary CTA  
- Connected visibility to `formHasMeaningfulContent()`  

**Not Touched:**  
- Generate logic  
- Parser  
- Stage switching  

---

## Conditional CTA Visibility — Content-Aware Display

**Summary:**  
Form action buttons now appear only when meaningful content exists.

**Root Issue:**  
CTA buttons showed prematurely or inconsistently between upload and paste flows.

**Scope:**  
UI + State visibility logic

**Key Changes:**  
- Updated `formHasMeaningfulContent()` to include paste field  
- Buttons hidden on initial load  
- Buttons appear after:  
  - upload population  
  - paste input debounce + populate  
- Buttons hide again on `clearAll()`  
- Restricted to Form stage only  

**Not Touched:**  
- Parsing logic  
- Upload extraction  
- Generation pipeline  

---

## Stage Flow Simplification — Remove Top Stepper on Mobile

**Summary:**  
Removed visual reliance on 1–2–3 stepper in mobile view.

**Root Issue:**  
Top stepper conflicted with new tab-based navigation and created redundant hierarchy.

**Scope:**  
UI Layer

**Key Changes:**  
- Hidden or demoted `.stage-flow-nav` in mobile view  
- Navigation responsibility moved entirely to bottom tab bar  

**Not Touched:**  
- Stage logic (`switchStage`)  
- Desktop UI  

---

## TXT Upload Parser Fallback Fix

**Summary:**  
Plain TXT uploads now correctly populate the Prophetic "word" field.

**Root Issue:**  
Unlabeled TXT content passed through parser but was not assigned to any visible field, resulting in empty form after upload.

**Scope:**  
Parser Layer

**Key Changes:**  
- Added fallback in `parsePropheticFallback()`:  
  ```javascript  
  if (!result.word) {  
    result.word = normalizePropheticText(text);  
  }  
  ```

**Not Touched:**  
- Other parser modes  
- Upload file reading  
- Form population logic
