import { useRef, useState } from 'preact/hooks';
import type { FieldHandle } from '@/design-system';
import { normalizeTrigram } from '@/engine/identity';
import {
  TIER_OVR_RANGES,
  isOvrInTier,
  isTier,
  ovrAfterTierChange,
  rollOVR,
  type Tier,
} from '@/engine/tier-ovr';
import { freshRng } from '@/app/random';
import { checkTeamName } from '@/features/components';
import type EditTeamDrawerProps from './types';
import type { EditTeamErrors, EditTeamState } from './types';

export const NAME_TAKEN = 'Another team of this league has this name.';
export const TRIGRAM_INVALID = 'Use 3 letters or digits.';
export const TRIGRAM_TAKEN = 'Another team has this trigram fixed.';

const NO_ERRORS: EditTeamErrors = { name: null, ovr: null, trigram: null };

const rangeText = (tier: Tier): string =>
  `${TIER_OVR_RANGES[tier].min} to ${TIER_OVR_RANGES[tier].max}`;

const sameName = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/** The Edit drawer of a wizard team (US-08.4, Task 172). The fields stay
 * uncontrolled, as in `TeamForm`. Only the Tier is state, for the range of
 * the OVR label: a Tier change rolls a new OVR from the new Tier at once
 * (Task 81, Task 116). */
export function useEditTeam({
  team,
  blueprint,
  otherNames,
  otherFixedTrigrams,
  rng,
  onSave,
}: Pick<
  EditTeamDrawerProps,
  'team' | 'blueprint' | 'otherNames' | 'otherFixedTrigrams' | 'rng' | 'onSave'
>): EditTeamState {
  const nameRef = useRef<FieldHandle<string>>(null);
  const colourRef = useRef<FieldHandle<string>>(null);
  const tierRef = useRef<FieldHandle<string>>(null);
  const ovrRef = useRef<FieldHandle<string>>(null);
  const trigramRef = useRef<FieldHandle<string>>(null);
  const rngRef = useRef(rng ?? freshRng());
  const [tier, setTier] = useState<Tier>(team.tier);
  const [errors, setErrors] = useState<EditTeamErrors>(NO_ERRORS);

  const handleTierChange = (value: string): void => {
    if (!isTier(value)) return;
    const ovr = Number(ovrRef.current?.getValue());
    const next = ovrAfterTierChange({ tier, ovr }, value, rngRef.current);
    ovrRef.current?.setValue(String(next));
    setTier(value);
  };

  const handleReset = (): void => {
    if (!blueprint) return;
    nameRef.current?.setValue(blueprint.name);
    colourRef.current?.setValue(blueprint.colour);
    tierRef.current?.setValue(blueprint.tier);
    ovrRef.current?.setValue(String(rollOVR(blueprint.tier, rngRef.current)));
    trigramRef.current?.setValue('');
    setTier(blueprint.tier);
    setErrors(NO_ERRORS);
  };

  const handleSave = (): void => {
    const name = nameRef.current?.getValue() ?? '';
    const ovr = Number(ovrRef.current?.getValue());
    const typed = (trigramRef.current?.getValue() ?? '').trim();
    const trigram = typed === '' ? null : normalizeTrigram(typed);

    const next: EditTeamErrors = {
      name:
        checkTeamName(name) ??
        (otherNames.some((other) => sameName(other, name)) ? NAME_TAKEN : null),
      ovr: isOvrInTier(ovr, tier)
        ? null
        : `Use a whole number from ${rangeText(tier)}.`,
      trigram:
        typed !== '' && trigram === null
          ? TRIGRAM_INVALID
          : trigram !== null && otherFixedTrigrams.includes(trigram)
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
      fixedTrigram: trigram,
    });
  };

  return {
    nameRef,
    colourRef,
    tierRef,
    ovrRef,
    trigramRef,
    ovrLabel: `OVR (${rangeText(tier)})`,
    errors,
    canReset: blueprint !== undefined,
    handleTierChange,
    handleReset,
    handleSave,
  };
}
