import type { JSX } from 'preact';
import { Button, Select } from '@/design-system';
import { StatusLine } from '@/features/components';
import { FileCard } from './FileCard';
import { useFileManager } from './useFileManager';
import styles from './FileScreen.module.css';

/** The File screen. Layout follows `Footballer - File Manager.dc.html`,
 * with no league save or load cards until Task 149 (Task 161).
 * `useFileManager` gives the data and the handlers. */
export function FileScreen(): JSX.Element {
  const file = useFileManager();

  return (
    <div class={styles.screen}>
      <div>
        <h1>File</h1>
        <p class={styles.subtitle}>
          Import or export team lists, and export results. Ctrl+S saves your leagues and
          teams.
        </p>
      </div>

      <StatusLine placement="page" />

      <div class={styles.cards}>
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
                defaultValue={file.defaultLeagueUuid}
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
