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
      <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>{title}</h2>
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

function App(): JSX.Element {
  const nameRef = useRef<FieldHandle<string>>(null);
  const pointsRef = useRef<FieldHandle<string>>(null);
  const [loggedValues, setLoggedValues] = useState<string | null>(null);
  const [format, setFormat] = useState('round-robin-two-way');
  const [includeByes, setIncludeByes] = useState(true);
  const [homeAdvantage, setHomeAdvantage] = useState(true);

  return (
    <main
      style={{
        background: 'var(--color-bg)',
        color: 'var(--color-fg)',
        fontFamily: 'var(--font-body)',
        minHeight: '100vh',
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
      }}
    >
      <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>
        Design system preview
      </h1>

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
              `Team name: ${nameRef.current?.getValue() ?? ''} · Points (W): ${pointsRef.current?.getValue() ?? ''}`,
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
          value={format}
          onChange={setFormat}
          options={[
            { label: 'Round robin (two-way)', value: 'round-robin-two-way' },
            { label: 'Round robin (single duels)', value: 'round-robin-single' },
          ]}
        />
      </Section>

      <Section title="Checkbox">
        <Checkbox label="Include byes" checked={includeByes} onChange={setIncludeByes} />
      </Section>

      <Section title="Switch">
        <Switch label="Home advantage" checked={homeAdvantage} onChange={setHomeAdvantage} />
      </Section>

      <Section title="Card">
        <Card padding="md">
          <strong>Coastal Premier</strong>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)' }}>
            Round robin (two-way) · 8 teams
          </div>
        </Card>
      </Section>

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
    </main>
  );
}

export default App;
