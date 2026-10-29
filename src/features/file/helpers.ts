import type { SelectOption } from '@/design-system';
import type { WrapperSummary } from '@/domain';

export const toLeagueOptions = (rows: readonly WrapperSummary[]): SelectOption[] =>
  rows.map((row) => ({ label: row.name, value: row.uuid }));
