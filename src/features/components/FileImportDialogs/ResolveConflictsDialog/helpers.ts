import type { SegmentedOption } from '@/design-system';
import type { ImportChoice } from '@/engine/identity';
import type { ImportRow } from '@/app/importFileActions';

export const CHOICE_OPTIONS: SegmentedOption<ImportChoice>[] = [
  { value: 'skip', label: 'Skip' },
  { value: 'new', label: 'Import as new' },
];

export const TYPE_LABELS: Record<ImportRow['type'], string> = {
  team: 'Team',
  league: 'League',
};

export const DESCRIPTION =
  'These already exist locally by UUID. Skip keeps your local version untouched; Import as new forks the incoming one with a fresh UUID.';
