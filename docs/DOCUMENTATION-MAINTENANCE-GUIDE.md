# Documentation Maintenance Guide

This guide helps maintain the clean, organized documentation structure established in November 2025.

## Documentation Philosophy

**Current over Historical:** Keep the `docs/` root directory focused on current, actionable documentation. Archive completed audits and implementation summaries once they're superseded.

**Clear Navigation:** Maintain clear pathways for three main audiences:
1. **Contributors** - Quick onboarding and development workflow
2. **Product/Design** - Feature specs and design system
3. **QA/Testing** - Testing guidelines and reports

## Directory Structure

```
docs/
├── README.md                     # Main documentation index (keep updated!)
├── FINAL-SUMMARY.md             # Overview of latest major work
├── DOCUMENTATION-CLEANUP.md     # This consolidation's strategy
├── [Current audit documents]    # Latest UX/UI audits
├── design/                      # Design system (evergreen)
├── process/                     # Developer workflows (evergreen)
├── product/                     # Product specs (evergreen)
├── reports/                     # Test reports and summaries
│   └── archive/                 # Historical documentation
└── templates/                   # Reusable templates
```

## When to Archive

Move documents to `reports/archive/` when:

1. **Superseded by newer versions**
   - Example: `UX-AUDIT-2025-11.md` is superseded by `UX-COMPLETE-AUDIT-2025-11-13.md`
   
2. **Implementation completed**
   - Example: `SPACEBAR-FIX-SUMMARY.md` after spacebar fix is merged and stable
   
3. **Specific feature/fix documented**
   - Example: `GRID-LAYOUT-FIT-FIX-2025-11-13.md` after grid layout is finalized

4. **Multiple overlapping audits exist**
   - Keep the most comprehensive and recent
   - Archive earlier iterations

## When to Keep in Root

Keep in `docs/` root when:

1. **Most current audit/report**
   - Latest comprehensive UX audit
   - Current implementation summary
   
2. **Actively referenced documentation**
   - Design tokens
   - Developer onboarding
   - Product specifications
   
3. **Evergreen content**
   - Contribution guidelines
   - Process workflows
   - Product vision

## Naming Conventions

Use consistent naming:

### Audits
- `UX-[SCOPE]-AUDIT-YYYY-MM-DD.md`
- Example: `UX-COMPLETE-AUDIT-2025-11-13.md`

### Implementation Summaries
- `[FEATURE]-IMPLEMENTATION-SUMMARY-YYYY-MM-DD.md`
- Example: `UX-IMPLEMENTATION-SUMMARY-2025-11-13.md`

### Fix/Feature Summaries
- `[FEATURE]-FIX-SUMMARY.md` or `[FEATURE]-SUMMARY.md`
- Example: `SPACEBAR-FIX-SUMMARY.md`

### Process Documents
- `[purpose].md` (lowercase with hyphens)
- Example: `quick_onboarding.md`, `build-checklist.md`

## Updating README.md

When adding new documentation, update `docs/README.md`:

1. **Add to appropriate section**
   - Current UI/UX Documentation
   - Process Documentation
   - Product Documentation
   - Design & Technical

2. **Update quick links**
   - Ensure all links point to current documents
   - Remove links to archived documents

3. **Maintain reading order**
   - Keep recommended reading order current
   - Update for new audiences if needed

## Archive README

When adding to archive, update `docs/reports/archive/README.md`:

1. **Add entry to appropriate category**
   - Historical UX/UI Audits
   - Feature Implementation Summaries
   - Fix/Improvement Summaries

2. **Include context**
   - Why it was archived
   - What superseded it (if applicable)
   - When it was relevant

## Quarterly Review

Every quarter, review documentation:

1. **Check for duplicates**
   - Look for overlapping content
   - Consolidate if possible

2. **Archive completed work**
   - Move feature summaries after 3+ months stable
   - Archive superseded audits

3. **Update navigation**
   - Fix broken links
   - Update README.md
   - Refresh quick links

4. **Verify evergreen content**
   - Update outdated process docs
   - Refresh design system references
   - Validate product specs

## Quality Checklist

Before committing documentation changes:

- [ ] README.md updated with new documents
- [ ] Archive README updated if archiving
- [ ] All internal links verified
- [ ] Naming conventions followed
- [ ] Appropriate section chosen (root vs archive)
- [ ] Cross-references updated
- [ ] Duplicate content consolidated

## Examples

### Good Documentation Flow

1. **New audit completed:** Create `UX-AUDIT-2025-12.md` in `docs/`
2. **Update README:** Add to "Current UI/UX Documentation" section
3. **Archive old audit:** Move previous audit to `reports/archive/`
4. **Update archive README:** Document why archived and what superseded it

### Bad Documentation Practices

❌ Leaving multiple versions in root (`UX-AUDIT-V1.md`, `UX-AUDIT-V2.md`, `UX-AUDIT-FINAL.md`)
❌ Creating documents with inconsistent naming
❌ Not updating README.md after adding new docs
❌ Deleting historical documents instead of archiving
❌ Mixing historical and current docs in same directory

## Questions?

If unsure whether to archive or keep a document:

**Ask:**
1. Is this the most current version?
2. Is this actively referenced by other docs?
3. Has this been superseded by newer work?
4. Is this implementation complete and stable?

**When in doubt:** Keep it in root for one more cycle, then archive after next review.

---

**Last Updated:** November 13, 2025  
**Next Review:** February 2026  
**Maintained by:** Project contributors
