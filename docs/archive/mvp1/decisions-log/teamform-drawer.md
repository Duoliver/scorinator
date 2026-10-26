# TeamForm becomes a real drawer — decisions log

A shared-component fix touching both `TeamsScreen` (Task 12) and `TeamsStep` inside League Setup (Task 13), condensed here from the running Decisions log in `PROGRESS.md` — see that section for the procedure this follows.

- **2026-09-14:** The user named a real bug. `TeamForm` rendered inline, in normal document flow, wherever its caller happened to place it. It was not a drawer, despite both callers naming it one. Both design-reference prototypes (`Footballer - Teams.dc.html`, `Footballer - League Setup Wizard.dc.html`) show the same real drawer instead: a dimmed overlay, plus a fixed 420px panel sliding from the right, with a title and a close button.

  New `design-system/components/Drawer`. Generic chrome, no team knowledge, only `title`, `onClose`, and `children`. `TeamsScreen` and `TeamsStep` both now wrap their `TeamForm` in it. This matches the prototypes exactly. Neither screen carries its own copy of this chrome anymore. `TeamForm` dropped its own `title` prop and `<h2>`. `Drawer` owns the title now, so the two no longer double up.

  `Drawer` closes on a click on its own close button, a click on the overlay, or Escape. It opens with `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing at the title. It moves focus to the close button on open. Full focus trapping, `Tab` cycling inside the drawer, was left out on purpose — flagged here, not silently skipped, in case a later session wants it.

  One real bug turned up along the way. It only surfaced once a real user, or a real test, typed into the form fast. The focus-on-open effect used `useEffect`. Preact defers that hook to a later tick. A field inside the drawer could already hold real focus, with real typed characters in it, by the time the deferred effect finally ran.

  At that point, the effect snatched focus back to the close button, mid-type. A held-down key then triggered a native click on the now-focused button. That closed the drawer, out from under the user. Fixed with `useLayoutEffect` instead. It runs synchronously, before that window can open. `Drawer.test.tsx` now exercises this exact path. So do the pre-existing `TeamsStep.test.tsx` and `TeamsScreen.test.tsx` create-team flows — a regression here would get caught.

  `TeamsScreen.tsx` also had its own unrelated naming collision, found while wiring `Drawer` in: a local `type Drawer = { mode: 'create' } | ...` state shape shared its name with the new imported component. TypeScript allows this — types and values sit in separate namespaces — but it read as one name for two different things. Renamed the local type to `TeamDrawerState`.

  273 tests, `type-check`, `lint`, and `build` all stay clean.
