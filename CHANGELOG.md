# Prophetic Word Generator Changelog

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
