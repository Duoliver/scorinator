# Task 21 — Filesystem adapter (`adapters/tauri-fs`)

**What was built:** `adapters/tauri-fs` wraps `@tauri-apps/plugin-fs` and `@tauri-apps/plugin-dialog`. It sits behind a small, domain-free contract.

`persistence/types.ts` defines two interfaces. `FileSystem` covers read, write, rename, remove, and exists. `SaveFileDialog` covers picking a save path and picking an open path. Both return `null` on a user cancel.

`atomicWrite.ts` holds `writeTextFileAtomic`. It writes to a sibling temp file first. It then renames that file over the real target. It removes the temp file on any failure.

`orchestrate.ts` adds two small functions: `saveTextFileWithDialog` and `openTextFileWithDialog`. Each combines a dialog pick with a file operation. Neither function knows about a "League" or any other save-file shape. `adapters/json-io`, from Task 9, owns that shape, on top of this module.

On the Rust side: `src-tauri/Cargo.toml` gained the `tauri-plugin-fs` and `tauri-plugin-dialog` crates. `src-tauri/src/lib.rs` now registers both plugins. `src-tauri/capabilities/default.json` grants the `fs` and `dialog` command permissions, plus an `fs:scope` grant.

**Test approach:** the production code touches the filesystem only through the injected `FileSystem` interface. So `atomicWrite.test.ts` supplies a second implementation of that interface. This second one runs on real Node `fs` calls, against a real `fs.mkdtemp` directory. This meets the `tdd` doc's real-disk integration-test rule for this module. It does not use a mock that just records calls.

The test file covers four cases. A plain write. An overwrite of an existing file. No leftover temp file after a successful write. A failed rename, which must leave the original file untouched and clean up the temp file. This last case is the actual crash-safety claim. All four cases pass.

The dialog wrapper, and the real Tauri-backed `FileSystem`, carry no vitest coverage. A native OS file dialog needs a person to click it. A headless test cannot do that. This session checked as much of that layer as the sandbox allows. `cargo check` compiles the Rust side clean, with both new plugins wired in. The `tauri::generate_context!()` macro validates capabilities at compile time, and it accepts the permission set below, `fs:scope` included.

This session could not run `npm run tauri:dev` end to end, and click through a real save or open dialog. This sandbox has no interactive display to drive a native GTK dialog from. That step stays open. Try it on a real desktop, or fold it into Task 17's manual check, since that task wires this adapter into a real screen anyway.

**Decisions made:**
- `fs:scope` is set to `{ "path": "**" }`. This grants the whole filesystem, not a narrow allow-list. The Tauri dialog plugin auto-grants scope only for the exact file the user picks. This session confirmed this by reading `tauri-plugin-dialog`'s source: it calls `tauri_scope.allow_file(&path)`, not a directory or glob grant. That covers a direct write to the picked path. It does not cover the sibling `.tmp-*` file the atomic-write step needs. Two ways exist around that. One: grant broad `fs:scope`, the choice made here. Two: write the temp file to the OS temp directory, then rename across directories. The second option risks a cross-device rename failure on the final move, once the save target sits on a different drive than the OS temp directory. That would break the same atomicity guarantee it exists to protect. Broad scope is standard practice for a desktop app built to read or write whatever file the user picks. This app has no sandboxed or untrusted-content model to defend. The path always still comes from the user, through a native OS dialog, never from network input or another process. This decision widens the OS-level file permissions the app declares. It does not widen what a user can actually reach, since the same dialog already lets a user open or write any file they hold OS permission for.
- The temp file sits beside the real target, as `<path>.tmp-<uuid>`, not in a system temp directory. This keeps the final rename on the same filesystem, for the reason above.
- `adapters/tauri-fs` stays domain-free on purpose. It holds no `saveLeague` or `loadLeague` function. That composition belongs to Task 17's thin app-level data layer, per `module-boundaries.md`'s rule that `features` never calls `adapters` directly.

**What is left, what is next:** a real click-through of the save and open dialogs, in a `tauri:dev` session with a display. Task 17, Save/Load UI, is the natural place for that check. It wires `json-io` and `tauri-fs` together behind a real screen, and needs the same manual check regardless.
