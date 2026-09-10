import type { JSX, RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  Switch,
  Table,
  Tabs,
  type TableColumn,
} from './design-system';
import type { FieldHandle } from './design-system/field';
import { createSeededRng } from './engine/rng';
import { applyHomeAdvantage, scorinateMatch } from './engine/scorination';
import { TIER_ORDER, rollOVR, type Tier } from './engine/tier-ovr';
import {
  openTextFileWithDialog,
  saveTextFileWithDialog,
  tauriDialog,
  tauriFileSystem,
} from './adapters/tauri-fs';
import { TeamsScreen } from './features/teams';
import { LeagueSetupScreen } from './features/leagues';

interface StandingsRow {
  id: string;
  pos: number;
  team: string;
  pts: number;
}

const standingsColumns: TableColumn<StandingsRow>[] = [
  { key: 'pos', header: '#', width: '3rem' },
  { key: 'team', header: 'Team' },
  { key: 'pts', header: 'Pts', width: '3.5rem', align: 'right' },
];

const standingsRows: StandingsRow[] = [
  { id: 'a', pos: 1, team: 'Salt Marsh United', pts: 19 },
  { id: 'b', pos: 2, team: 'Harborview SC', pts: 16 },
  { id: 'c', pos: 3, team: 'Redbrick Athletic', pts: 11 },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: JSX.Element | JSX.Element[];
}): JSX.Element {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>{title}</h2>
      <div
        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}
      >
        {children}
      </div>
    </section>
  );
}

function PointsPreview({
  pointsRef,
}: {
  pointsRef: RefObject<FieldHandle<string>>;
}): JSX.Element {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    const handle = pointsRef.current;
    if (!handle) return;
    setDisplay(handle.getValue());
    return handle.subscribe(setDisplay);
  }, [pointsRef]);

  return (
    <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)' }}>
      Currently: {display}
    </span>
  );
}

function FormatPreview({
  formatRef,
}: {
  formatRef: RefObject<FieldHandle<string>>;
}): JSX.Element {
  const [isSingleDuels, setIsSingleDuels] = useState(false);

  useEffect(() => {
    const handle = formatRef.current;
    if (!handle) return;
    const sync = (value: string): void =>
      setIsSingleDuels(value === 'round-robin-single');
    sync(handle.getValue());
    return handle.subscribe(sync);
  }, [formatRef]);

  return (
    <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)' }}>
      {isSingleDuels ? 'Single-duels mode: each pair meets once, not twice.' : ''}
    </span>
  );
}

const TIER_OPTIONS = TIER_ORDER.map((tier) => ({ label: tier, value: tier }));

function ScorinatorPlayground(): JSX.Element {
  const homeTierRef = useRef<FieldHandle<string>>(null);
  const awayTierRef = useRef<FieldHandle<string>>(null);
  const homeAdvantageRef = useRef<FieldHandle<boolean>>(null);
  const [score, setScore] = useState<string | null>(null);

  const handleScorinate = (): void => {
    const homeTier = (homeTierRef.current?.getValue() ?? 'B') as Tier;
    const awayTier = (awayTierRef.current?.getValue() ?? 'B') as Tier;
    const hasHomeAdvantage = homeAdvantageRef.current?.getValue() ?? false;
    const rng = createSeededRng(Math.floor(Math.random() * 0xffffffff));
    let homeOvr = rollOVR(homeTier, rng);
    const awayOvr = rollOVR(awayTier, rng);
    if (hasHomeAdvantage) homeOvr = applyHomeAdvantage(homeOvr);
    const { homeGoals, awayGoals } = scorinateMatch(homeOvr, awayOvr, rng);
    setScore(`${homeGoals} - ${awayGoals}`);
  };

  return (
    <Section title="Scorinator playground">
      <Select
        label="Team 1 tier"
        defaultValue="B"
        options={TIER_OPTIONS}
        ref={homeTierRef}
      />
      <Select
        label="Team 2 tier"
        defaultValue="B"
        options={TIER_OPTIONS}
        ref={awayTierRef}
      />
      <Switch label="Home advantage (Team 1)" ref={homeAdvantageRef} />
      <Button onClick={handleScorinate}>Scorinate</Button>
      <span
        style={{
          fontSize: '1.5rem',
          fontFamily: 'var(--font-heading)',
          minWidth: '4rem',
        }}
      >
        {score ?? ''}
      </span>
    </Section>
  );
}

function PersistencePlayground(): JSX.Element {
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    setStatus('Saving...');
    try {
      const contents = JSON.stringify(
        {
          savedAt: new Date().toISOString(),
          note: 'Written by the tauri-fs playground.',
        },
        null,
        2
      );
      const path = await saveTextFileWithDialog(
        tauriFileSystem,
        tauriDialog,
        contents,
        'scorinator-test.json'
      );
      setStatus(path === null ? 'Save canceled.' : `Saved to ${path}`);
    } catch (error) {
      setStatus(`Save failed: ${(error as Error).message}`);
    }
  };

  const handleOpen = async (): Promise<void> => {
    setStatus('Opening...');
    try {
      const result = await openTextFileWithDialog(tauriFileSystem, tauriDialog);
      setStatus(
        result === null
          ? 'Open canceled.'
          : `Opened ${result.path}:\n${result.contents}`
      );
    } catch (error) {
      setStatus(`Open failed: ${(error as Error).message}`);
    }
  };

  return (
    <Section title="Persistence playground (adapters/tauri-fs)">
      <Button onClick={handleSave}>Save test file...</Button>
      <Button variant="secondary" onClick={handleOpen}>
        Open file...
      </Button>
      <pre
        style={{
          width: '100%',
          margin: 0,
          fontSize: '0.875rem',
          color: 'var(--color-fg-muted)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {status ??
          'Click a button to try the real save/open dialog (Tauri desktop only).'}
      </pre>
    </Section>
  );
}

/** The design-system + engine playground built before any real screen
 * existed. Kept, collapsed, behind TeamsScreen rather than deleted — it is
 * still the only manual click-through path for the real save/open dialog
 * (see Task 21's report, and PERSISTENCE.md), which no automated test in
 * this sandbox can cover. Retire this once Task 17's real Save/Load UI
 * gives that check a proper home. */
function Playground(): JSX.Element {
  const nameRef = useRef<FieldHandle<string>>(null);
  const pointsRef = useRef<FieldHandle<string>>(null);
  const formatRef = useRef<FieldHandle<string>>(null);
  const includeByesRef = useRef<FieldHandle<boolean>>(null);
  const homeAdvantageRef = useRef<FieldHandle<boolean>>(null);
  const [loggedValues, setLoggedValues] = useState<string | null>(null);

  return (
    <details style={{ marginTop: '2rem' }}>
      <summary
        style={{
          cursor: 'pointer',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          padding: '0.5rem 0',
        }}
      >
        Design system + engine playground (dev only)
      </summary>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          padding: '1.5rem 0',
        }}
      >
        <Section title="Buttons">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </Section>

        <Section title="Badges">
          <Badge tone="dark">S</Badge>
          <Badge tone="accent">Win</Badge>
          <Badge tone="neutral">Draw</Badge>
          <Badge tone="error">Loss</Badge>
          <Badge tone="warning">Bye</Badge>
        </Section>

        <Section title="Input">
          <Input label="Team name" placeholder="e.g. Salt Marsh United" ref={nameRef} />
          <Input
            label="Points (W)"
            defaultValue="3"
            type="number"
            min={0}
            max={10}
            step={1}
            ref={pointsRef}
          />
          <PointsPreview pointsRef={pointsRef} />
          <Button
            size="sm"
            onClick={() =>
              setLoggedValues(
                `Team name: ${nameRef.current?.getValue() ?? ''} · Points (W): ${pointsRef.current?.getValue() ?? ''}`
              )
            }
          >
            Log values
          </Button>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)' }}>
            {loggedValues ?? ''}
          </span>
        </Section>

        <Section title="Select">
          <Select
            label="Format"
            defaultValue="round-robin-two-way"
            options={[
              { label: 'Round robin (two-way)', value: 'round-robin-two-way' },
              { label: 'Round robin (single duels)', value: 'round-robin-single' },
            ]}
            ref={formatRef}
          />
          <FormatPreview formatRef={formatRef} />
        </Section>

        <Section title="Checkbox">
          <Checkbox label="Include byes" defaultChecked ref={includeByesRef} />
        </Section>

        <Section title="Switch">
          <Switch label="Home advantage" defaultChecked ref={homeAdvantageRef} />
        </Section>

        <Section title="Card">
          <Card padding="md">
            <strong>Coastal Premier</strong>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)' }}>
              Round robin (two-way) · 8 teams
            </div>
          </Card>
        </Section>

        <ScorinatorPlayground />

        <PersistencePlayground />

        <Section title="Tabs + Table">
          <div style={{ width: '100%' }}>
            <Tabs
              defaultTab="standings"
              tabs={[
                {
                  id: 'standings',
                  label: 'Standings',
                  content: (
                    <Table
                      columns={standingsColumns}
                      rows={standingsRows}
                      rowKey={(r) => r.id}
                    />
                  ),
                },
                {
                  id: 'fixtures',
                  label: 'Fixtures',
                  content: <p>Fixtures tab — no data wired up in this preview.</p>,
                },
              ]}
            />
          </div>
        </Section>
      </div>
    </details>
  );
}

function App(): JSX.Element {
  return (
    <main
      style={{
        background: 'var(--color-bg)',
        color: 'var(--color-fg)',
        fontFamily: 'var(--font-body)',
        minHeight: '100vh',
      }}
    >
      <TeamsScreen />
      <LeagueSetupScreen />
      <div style={{ padding: '0 3rem 3rem' }}>
        <Playground />
      </div>
    </main>
  );
}

export default App;
