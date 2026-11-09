import type { ImportRow } from '@/app/importFileActions';

export default interface ImportRowLabelProps {
  row: Pick<ImportRow, 'name' | 'uuid'>;
}
