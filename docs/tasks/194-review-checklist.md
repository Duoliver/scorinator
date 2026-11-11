# Task 194: rewrite the code review checklist

**Status:** Done

## Goal

Make `docs/code-review-checklist.md` the first thing that the refactor pass reads (Task 193). It covers the coding standards and the module boundaries of today. Each entry links to its rule in the docs, and one entry says to read the local docs of each module or feature that a task touched.

## Acceptance criteria

Agreed with the user on 2026-11-11.

- [x] 1. Each entry is one short line that ends with a link to its rule. The rule text and its examples stay in the source doc.
- [x] 2. The first entry says to read the local docs of each module or feature in the diff.
- [x] 3. The sections: local docs, scope, boundaries, components, stores, names, CSS, design system, comments, tests, engine, persistence, process.
- [x] 4. The scope entries point to the scope line of `PROGRESS.md`, not to MVP numbers.
- [x] 5. A rule in two docs gets one entry, with a link to the main rule.
- [x] 6. The process section has the refactor pass items. "The PR" becomes "the task notes".
- [x] 7. The links use GitHub heading anchors. A script checks each anchor.
- [x] 8. The checklist serves a normal review too. "Check only the sections that apply" stays.
- [x] The user reviews the checklist.

## Notes

- **2026-11-11:** Task created by User at Task 193 (choice 10): "updating the code review checklist to encompass coding standards and module boundaries as of today. This checklist is currently in the same version as I generated it a couple of months ago."
- **2026-11-11:** Facts. The checklist has 75 lines in 8 sections: scope, module boundaries, general standards, tests, engine determinism, persistence, design system, process. It has no links. It still says "MVP1 or MVP2" and "the PR". Rules it does not cover yet: the three component layers, one folder for each component, the `features/components/` import direction, a store with its actions file, the cold-cache draft store, absolute imports, the centered container, verb names, a boolean prop off by default, `getErrorMessage`, the `as const` value sets, the field label size, `useFieldHandle`, the native `<dialog>` overlay, the palette file, `elements.css` and border-box, and the `domain/` rules. Sources: `docs/coding-standards.md` (340 lines), `docs/module-boundaries.md`, `docs/tdd.md`, and the five module docs.
- **2026-11-11:** The user agreed choices 1 to 8.

## Report

- **What was built:** `docs/code-review-checklist.md`, rewritten: 59 entries in 13 sections, each with a link to its rule. The first section is the local docs. 17 rules that the old list missed now have an entry. The old entries stay, in shorter words, except "one epic for each task", which is a planning rule, not a code check.
- **Test approach:** no code. A script computes the GitHub heading anchors of each source doc and checks the 60 links: all of them resolve. The STE lint gives 2.1 violations for each 100 words.
- **Decisions made:** choices 1 to 8, agreed by the user. Claude choices: no entry restates a rule that no doc holds. The `style` prop entry names only the team colour, as the rule does.
- **What is left, what is next:** a rule that a later task adds to a doc needs an entry here too. Then the MVP3 scope and its refinement.
- **Refactor:** No code, no refactor step.
