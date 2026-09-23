import { useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Button, Select } from '@/design-system';
import type { FieldHandle } from '@/design-system/field';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';
import { saveLeagueBySlug } from '@/app/saveActions';
import { loadLeagueFile, type LoadedLeagueFile } from '@/app/data/leagueFile';
import { exportTeamsCsv, importTeamsCsv } from '@/app/data/teamsCsv';
import { importTeamsJson } from '@/app/data/teamsJson';
import { FileCard } from './FileCard';
import {
  csvRecordToTeamRecord,
  mergeImportedTeams,
  teamRecordToCsvRecord,
} from './importMerge';
import styles from './FileScreen.module.css';

/** The File screen (Task 17): save and load a league, import and export
 * team lists, and export results. Layout follows `Footballer - File
 * Manager.dc.html`. Team CSV/JSON import and export moved here from
 * `TeamsScreen`, unchanged apart from where their result message goes: every
 * action on this screen reports through `fileStore`'s status line, the
 * same one Ctrl+S uses. Export results is a placeholder until Task 18. */
export function FileScreen(): JSX.Element {
  const leagues = useLeagueStore((state) => state.leagues);
  const loadLeague = useLeagueStore((state) => state.loadLeague);
  const setTeams = useTeamsStore((state) => state.setTeams);
  const currentLeagueSlug = useFileStore((state) => state.currentLeagueSlug);
  const status = useFileStore((state) => state.status);
  const { setPath, setCurrent, setStatus } = useFileStore.getState();

  const leagueSelect = useRef<FieldHandle<string>>(null);
  const [pendingLoad, setPendingLoad] = useState<LoadedLeagueFile | null>(null);

  // A league picked in the selector, or else the current one, or else the first.
  const defaultLeagueSlug = leagues.some((league) => league.slug === currentLeagueSlug)
    ? (currentLeagueSlug as string)
    : (leagues[0]?.slug ?? '');

  const selectedSlug = (): string =>
    leagueSelect.current?.getValue() || defaultLeagueSlug;

  const handleSave = (saveAs: boolean): void => {
    const slug = selectedSlug();
    void (saveAs ? saveLeagueBySlug(slug, { saveAs: true }) : saveLeagueBySlug(slug));
  };

  const applyLoaded = (loaded: LoadedLeagueFile): void => {
    loadLeague(loaded.league);
    setTeams(mergeImportedTeams(useTeamsStore.getState().teams, loaded.teams));
    setPath(loaded.league.slug, loaded.path);
    setCurrent(loaded.league.slug);
    setStatus({
      tone: 'info',
      message: `Loaded ${loaded.league.name} from ${loaded.path}`,
    });
  };

  const handleLoad = async (): Promise<void> => {
    try {
      const loaded = await loadLeagueFile();
      if (loaded === null) return;
      const clash = useLeagueStore
        .getState()
        .leagues.some((league) => league.slug === loaded.league.slug);
      if (clash) {
        setPendingLoad(loaded);
        return;
      }
      applyLoaded(loaded);
    } catch (error) {
      setStatus({ tone: 'error', message: (error as Error).message });
    }
  };

  const confirmReplace = (): void => {
    if (pendingLoad) applyLoaded(pendingLoad);
    setPendingLoad(null);
  };

  const importedMessage = (count: number): string =>
    `Imported ${count} team${count === 1 ? '' : 's'}.`;

  const handleImportCsv = async (): Promise<void> => {
    try {
      const imported = await importTeamsCsv();
      if (imported === null) return;
      const records = imported.map(csvRecordToTeamRecord);
      setTeams(mergeImportedTeams(useTeamsStore.getState().teams, records));
      setStatus({ tone: 'info', message: importedMessage(records.length) });
    } catch (error) {
      setStatus({ tone: 'error', message: (error as Error).message });
    }
  };

  const handleImportJson = async (): Promise<void> => {
    try {
      const imported = await importTeamsJson();
      if (imported === null) return;
      const records = imported.map(csvRecordToTeamRecord);
      setTeams(mergeImportedTeams(useTeamsStore.getState().teams, records));
      setStatus({ tone: 'info', message: importedMessage(records.length) });
    } catch (error) {
      setStatus({ tone: 'error', message: (error as Error).message });
    }
  };

  const handleExportCsv = async (): Promise<void> => {
    try {
      const path = await exportTeamsCsv(
        useTeamsStore.getState().teams.map(teamRecordToCsvRecord)
      );
      setStatus({
        tone: 'info',
        message: path === null ? 'Export canceled.' : `Saved to ${path}`,
      });
    } catch (error) {
      setStatus({ tone: 'error', message: (error as Error).message });
    }
  };

  const confirmFooter = pendingLoad ? (
    <div class={styles.confirm}>
      <p class={styles.confirmText}>
        Replace "{pendingLoad.league.name}"? A league with this name is already open.
        Unsaved changes to it are lost.
      </p>
      <Button variant="primary" size="sm" onClick={confirmReplace}>
        Replace
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setPendingLoad(null)}>
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

      {status && (
        <p
          role="status"
          class={`${styles.status} ${status.tone === 'error' ? styles.statusError : ''}`}
        >
          {status.message}
        </p>
      )}

      <div class={styles.cards}>
        <FileCard
          title="Save league"
          description="Writes teams, fixtures, results and config to a re-importable JSON file."
          input={
            leagues.length === 0 ? (
              <span class={styles.hint}>No leagues to save yet.</span>
            ) : (
              <Select
                ref={leagueSelect}
                label="League"
                defaultValue={defaultLeagueSlug}
                options={leagues.map((league) => ({
                  label: league.name,
                  value: league.slug,
                }))}
              />
            )
          }
        >
          <Button
            size="md"
            disabled={leagues.length === 0}
            onClick={() => handleSave(false)}
          >
            Save
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled={leagues.length === 0}
            onClick={() => handleSave(true)}
          >
            Save as...
          </Button>
        </FileCard>

        <FileCard
          title="Load league"
          description="Resume exactly where you left off from a previously saved JSON file."
          footer={confirmFooter}
        >
          <Button variant="secondary" size="md" onClick={handleLoad}>
            Load...
          </Button>
        </FileCard>

        <div class={styles.divider} />

        <FileCard
          title="Import teams"
          description="CSV columns: Slug, Name, Colour, Tier."
        >
          <Button variant="secondary" size="sm" onClick={handleImportJson}>
            Import JSON...
          </Button>
          <Button variant="secondary" size="sm" onClick={handleImportCsv}>
            Import CSV...
          </Button>
        </FileCard>

        <FileCard
          title="Export teams"
          description="Back up or reuse your current team list elsewhere."
        >
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            Export CSV...
          </Button>
        </FileCard>

        <FileCard
          title="Export results"
          description="Read-only, human-readable summary — for reading, not re-importing."
        >
          <span class={styles.hint}>Coming soon.</span>
          <Button variant="secondary" size="sm" disabled>
            Export results...
          </Button>
        </FileCard>
      </div>
    </div>
  );
}
FileScreen.displayName = 'FileScreen';
