import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import {
  Badge,
  Button,
  Card,
  Input,
  Table,
  Tabs,
  type TableColumn,
} from './design-system';

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

function App(): JSX.Element {
  const [tab, setTab] = useState('standings');
  const [name, setName] = useState('');

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
        <Input
          label="Team name"
          value={name}
          onChange={setName}
          placeholder="e.g. Salt Marsh United"
        />
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
          }}
        >
          <Tabs
            tabs={[
              { id: 'standings', label: 'Standings' },
              { id: 'fixtures', label: 'Fixtures' },
            ]}
            activeId={tab}
            onChange={setTab}
          />
          {tab === 'standings' ? (
            <Table
              columns={standingsColumns}
              rows={standingsRows}
              rowKey={(r) => r.id}
            />
          ) : (
            <p>Fixtures tab — no data wired up in this preview.</p>
          )}
        </div>
      </Section>
    </main>
  );
}

export default App;
