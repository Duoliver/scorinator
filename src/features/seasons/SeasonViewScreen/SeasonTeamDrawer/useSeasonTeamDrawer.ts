import { useRef, useState } from 'preact/hooks';
import type { FieldHandle } from '@/design-system';
import { getNameKey, normalizeTrigram } from '@/engine/identity';
import { isOvrInTier, isTier, ovrAfterTierChange, type Tier } from '@/engine/tier-ovr';
import { freshRng } from '@/app/random';
import { checkTeamName } from '@/features/components';
import {
  formatOvrRange,
  formatReachNote,
  NAME_TAKEN,
  TRIGRAM_INVALID,
  TRIGRAM_TAKEN,
} from './helpers';
import type SeasonTeamDrawerProps from './types';
import type { SeasonTeamDrawerState, SeasonTeamErrors } from './types';

const NO_ERRORS: SeasonTeamErrors = { name: null, ovr: null, trigram: null };

/** The fields of the Season team drawer. The fields stay uncontrolled, as in
 * the wizard Edit drawer. A Tier change rolls a new OVR (Task 81). A Save
 * shows each problem next to its field, and gives nothing until all pass. */
export function useSeasonTeamDrawer({
  team,
  leagueNames,
  otherNames,
  otherTrigrams,
  rng,
  onSave,
}: Omit<SeasonTeamDrawerProps, 'onCancel'>): SeasonTeamDrawerState {
  const nameRef = useRef<FieldHandle<string>>(null);
  const colourRef = useRef<FieldHandle<string>>(null);
  const tierRef = useRef<FieldHandle<string>>(null);
  const ovrRef = useRef<FieldHandle<string>>(null);
  const trigramRef = useRef<FieldHandle<string>>(null);
  const rngRef = useRef(rng ?? freshRng());
  const [tier, setTier] = useState<Tier>(team.tier);
  const [errors, setErrors] = useState<SeasonTeamErrors>(NO_ERRORS);

  const handleTierChange = (value: string): void => {
    if (!isTier(value)) return;
    const ovr = Number(ovrRef.current?.getValue());
    ovrRef.current?.setValue(
      String(ovrAfterTierChange({ tier, ovr }, value, rngRef.current))
    );
    setTier(value);
  };

  const handleSave = (): void => {
    const name = nameRef.current?.getValue() ?? '';
    const ovr = Number(ovrRef.current?.getValue());
    const trigram = normalizeTrigram(trigramRef.current?.getValue() ?? '');
    const next: SeasonTeamErrors = {
      name:
        checkTeamName(name) ??
        (otherNames.some((other) => getNameKey(other) === getNameKey(name))
          ? NAME_TAKEN
          : null),
      ovr: isOvrInTier(ovr, tier)
        ? null
        : `Use a whole number from ${formatOvrRange(tier)}.`,
      trigram:
        trigram === null
          ? TRIGRAM_INVALID
          : otherTrigrams.includes(trigram)
            ? TRIGRAM_TAKEN
            : null,
    };
    setErrors(next);
    if (next.name !== null || next.ovr !== null || next.trigram !== null) return;
    onSave({
      name: name.trim(),
      colour: colourRef.current?.getValue() ?? team.colour,
      tier,
      ovr,
      trigram: trigram ?? team.trigram,
    });
  };

  return {
    nameRef,
    colourRef,
    tierRef,
    ovrRef,
    trigramRef,
    ovrLabel: `OVR (${formatOvrRange(tier)})`,
    note: formatReachNote(leagueNames),
    errors,
    handleTierChange,
    handleSave,
  };
}
