import { useState } from 'preact/hooks';
import { SEASON_TAKEN } from '@/features/seasons/SeasonsListScreen/helpers';
import type SeasonDialogProps from './types';
import type { SeasonDialogState } from './types';

/** The fields of the Season dialog. The submit stays off while a field is
 * blank. A taken name and year shows the error after the click, and gives
 * nothing (Task 212 choice 4). */
export function useSeasonDialog({
  initialName,
  initialYear,
  isTaken,
  onSubmit,
}: Pick<
  SeasonDialogProps,
  'initialName' | 'initialYear' | 'isTaken' | 'onSubmit'
>): SeasonDialogState {
  const [name, setNameValue] = useState(initialName);
  const [year, setYearValue] = useState(initialYear);
  const [error, setError] = useState<string | null>(null);

  const values = { name: name.trim(), year: year.trim() };
  return {
    setName: (next): void => {
      setNameValue(next);
      setError(null);
    },
    setYear: (next): void => {
      setYearValue(next);
      setError(null);
    },
    canSubmit: values.name !== '' && values.year !== '',
    error,
    handleSubmit: (event): void => {
      event.preventDefault();
      if (values.name === '' || values.year === '') return;
      if (isTaken(values.name, values.year)) {
        setError(SEASON_TAKEN);
        return;
      }
      onSubmit(values);
    },
  };
}
