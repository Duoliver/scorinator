import type { JSX } from 'preact';
import { Button, ConfirmDialog } from '@/design-system';
import { FileImportDialogs, StatusLine } from '@/features/components';
import { FileCard } from './FileCard';
import { useFileManager } from './useFileManager';
import styles from './FileScreen.module.css';

/** The File screen. Layout follows `Footballer - File Manager.dc.html`, with
 * the US-10.2 and US-10.4 texts in place of its MVP3 scope. */
export function FileScreen(): JSX.Element {
  const file = useFileManager();

  return (
    <div class={styles.screen}>
      <div>
        <h1>File</h1>
        <p class={styles.subtitle}>
          Bulk export/import for leagues, team blueprints, and the whole database.
          Exporting a single league is on that league's Detail screen.
        </p>
      </div>

      <StatusLine placement="page" />

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Leagues</h2>
        <FileCard
          title="Export all leagues"
          description="Every league in one JSON file, teams included."
        >
          <Button disabled={!file.hasLeagues} onClick={file.handleExportLeagues}>
            Export .json
          </Button>
        </FileCard>
        <FileCard
          title="Import leagues"
          description="Pick which leagues from the file to bring in."
        >
          <Button variant="secondary" onClick={file.handleImportLeagues}>
            Import .json…
          </Button>
        </FileCard>
      </section>

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Team Blueprints</h2>
        <FileCard
          title="Export all team blueprints"
          description="Full fidelity JSON, incl. UUID and provenance — not tied to any league."
        >
          <Button disabled={!file.hasBlueprints} onClick={file.handleExportBlueprints}>
            Export .json
          </Button>
        </FileCard>
        <FileCard
          title="Import teams"
          description="Pick which blueprints from the file to bring in."
        >
          <Button variant="secondary" onClick={file.handleImportBlueprints}>
            Import .json…
          </Button>
        </FileCard>
        <FileCard
          title="Quick team list (CSV)"
          description="ID/slug, Name, Colours, Tier, Location (optional). No provenance — for fast bulk edits, not identity-tracked sharing."
        >
          <Button variant="secondary" onClick={file.handleImportCsv}>
            Import .csv…
          </Button>
          <Button
            variant="secondary"
            disabled={!file.hasBlueprints}
            onClick={file.handleExportCsv}
          >
            Export .csv
          </Button>
        </FileCard>
      </section>

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Database</h2>
        <FileCard
          title="Export entire database"
          description="Everything — team blueprints and leagues, with their teams."
        >
          <Button
            disabled={!file.hasLeagues && !file.hasBlueprints}
            onClick={file.handleExportDatabase}
          >
            Export .zip
          </Button>
        </FileCard>
        <FileCard
          title="Import entire database"
          description="Merges into your local database — never a wholesale replace."
        >
          <Button variant="secondary" onClick={file.handleImportDatabase}>
            Import .zip…
          </Button>
        </FileCard>
      </section>

      {file.importConfirm && <ConfirmDialog {...file.importConfirm} />}
      {file.importDialogs && <FileImportDialogs {...file.importDialogs} />}
    </div>
  );
}
FileScreen.displayName = 'FileScreen';
