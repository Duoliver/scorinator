import type { JSX } from 'preact';
import { Button, Select } from '@/design-system';
import { FileCard } from './FileCard';
import { statusClassName } from './helpers';
import { useFileManager } from './useFileManager';
import styles from './FileScreen.module.css';

/** The File screen. Layout follows `Footballer - File Manager.dc.html`.
 * `useFileManager` gives the data and the handlers. */
export function FileScreen(): JSX.Element {
  const file = useFileManager();

  const confirmFooter =
    file.pendingLeagueName !== null ? (
      <div class={styles.confirm}>
        <p class={styles.confirmText}>
          Replace "{file.pendingLeagueName}"? A league with this name is already open.
          Unsaved changes to it are lost.
        </p>
        <Button variant="primary" size="sm" onClick={file.confirmReplace}>
          Replace
        </Button>
        <Button variant="secondary" size="sm" onClick={file.cancelReplace}>
          Cancel
        </Button>
      </div>
    ) : undefined;

  return (
    <div class={styles.screen}>
      <div>
        <h1>File</h1>
        <p class={styles.subtitle}>
          Save/load your progress, and import or export team lists and results.
        </p>
      </div>

      {file.status && (
        <p role="status" class={statusClassName(file.status)}>
          {file.status.message}
        </p>
      )}

      <div class={styles.cards}>
        <FileCard
          title="Save league"
          description="Writes teams, fixtures, results and config to a re-importable JSON file."
          input={
            file.hasLeagues ? (
              <Select
                ref={file.leagueSelect}
                label="League"
                defaultValue={file.defaultLeagueSlug}
                options={file.leagueOptions}
              />
            ) : (
              <span class={styles.hint}>No leagues to save yet.</span>
            )
          }
        >
          <Button size="md" disabled={!file.hasLeagues} onClick={file.handleSave}>
            Save
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled={!file.hasLeagues}
            onClick={file.handleSaveAs}
          >
            Save as...
          </Button>
        </FileCard>

        <FileCard
          title="Load league"
          description="Resume exactly where you left off from a previously saved JSON file."
          footer={confirmFooter}
        >
          <Button variant="secondary" size="md" onClick={file.handleLoad}>
            Load...
          </Button>
        </FileCard>

        <div class={styles.divider} />

        <FileCard
          title="Import teams"
          description="CSV columns: Slug, Name, Colour, Tier."
        >
          <Button variant="secondary" size="sm" onClick={file.handleImportJson}>
            Import JSON...
          </Button>
          <Button variant="secondary" size="sm" onClick={file.handleImportCsv}>
            Import CSV...
          </Button>
        </FileCard>

        <FileCard
          title="Export teams"
          description="Back up or reuse your current team list elsewhere."
        >
          <Button variant="secondary" size="sm" onClick={file.handleExportTeams}>
            Export CSV...
          </Button>
        </FileCard>

        <FileCard
          title="Export results"
          description="Read-only, human-readable summary — for reading, not re-importing."
          input={
            file.hasLeagues ? (
              <Select
                ref={file.resultsSelect}
                label="League to export"
                defaultValue={file.defaultLeagueSlug}
                options={file.leagueOptions}
              />
            ) : (
              <span class={styles.hint}>No leagues to export yet.</span>
            )
          }
        >
          <Button
            variant="secondary"
            size="sm"
            disabled={!file.hasLeagues}
            onClick={file.handleExportResults}
          >
            Export TXT...
          </Button>
        </FileCard>
      </div>
    </div>
  );
}
FileScreen.displayName = 'FileScreen';
