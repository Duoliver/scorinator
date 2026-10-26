# User stories

The MVP specs list each user story as one line. A refinement task turns the stories of one epic into refined stories, in one file here. The refined stories are the input for the build tasks: each build task names the stories it delivers.

Refinement also finds gaps in the spec. Each gap gets an answer from the user, or an entry in the `PROGRESS.md` Open questions.

## Files

- One folder for each MVP, for example `mvp2/`.
- One file for each epic: `NN-epic-slug.md`, with `NN` in the order of the spec, for example `mvp2/04-bracket-phase.md`.
- The spec stays the source for the design decisions. A refined story links to the spec section it comes from. If a refinement changes a decision, the spec gets an edit too, with the user's approval.

## Story IDs

`US-NN.M`: `NN` is the epic number, and `M` counts the stories of that epic, from 1. For example, `US-04.3` is the third story of epic 04.

An ID never changes and is never reused. A dropped story keeps its ID and gets the status Dropped. A task, a test name, a commit message, or an open question can name a story by its ID.

## Story template

```markdown
### US-NN.M: short title

**Status:** Draft | Refined | Agreed | Dropped
**Spec:** `docs/scorinator-mvp2.md` §1 <section>, §2 <epic>

As a <user>, I want <goal>, so that <reason>.

**Acceptance criteria:**

- [ ] A result that a test or a person can check.
- [ ] ...

**Out of scope:** what this story does not cover, and where it goes instead (another story, a later MVP, or `scorinator-future-features.md`).

**Notes:** gaps found, open questions with a link, and decisions with a link to the Decisions log.
```

**Status:**

- **Draft:** copied from the spec, not refined yet.
- **Refined:** Claude wrote the criteria. The user did not agree them yet.
- **Agreed:** the user agreed the story and its criteria. A build task can start.
- **Dropped:** out of scope. The Notes say why.

## Acceptance criteria form

The criteria are a plain checklist for now (decided 2026-10-26, Task 85).

**Parked:** the Given / When / Then form. Each criterion would then map to one test, which fits `docs/tdd.md` step 1. Check this idea again if the checklists turn out too loose to test from.
