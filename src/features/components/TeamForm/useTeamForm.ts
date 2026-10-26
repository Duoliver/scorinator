import { useRef, useState } from 'preact/hooks';
import { DEFAULT_TEAM_COLOUR, type FieldHandle } from '@/design-system';
import { slug } from '@/engine/identity';
import { isTier } from '@/engine/tier-ovr';
import type TeamFormProps from './types';
import type { TeamFormState } from './types';
import { DEFAULT_TIER, TEAM_NAME_INVALID, getSlugPreview } from './helpers';

/** The fields stay uncontrolled: each one keeps its own value, and the
 * hook reads them through their handles on Save. Only the slug preview is
 * written as the user types, so a keystroke does not render the form again. */
export function useTeamForm({
  initial,
  onSave,
}: Pick<TeamFormProps, 'initial' | 'onSave'>): TeamFormState {
  const nameRef = useRef<FieldHandle<string>>(null);
  const slugRef = useRef<FieldHandle<string>>(null);
  const colourRef = useRef<FieldHandle<string>>(null);
  const tierRef = useRef<FieldHandle<string>>(null);
  const [error, setError] = useState<string | null>(null);

  // An edited team keeps its own colour, even a blank one from an import,
  // so only a new team gets the default.
  const startValues = {
    name: initial?.name,
    slug: initial?.slug,
    colour: initial ? initial.colour : DEFAULT_TEAM_COLOUR,
    tier: initial?.tier ?? DEFAULT_TIER,
  };

  const handleNameChange = (name: string): void => {
    slugRef.current?.setValue(getSlugPreview(name));
  };

  const handleSave = (): void => {
    const name = nameRef.current?.getValue() ?? '';
    let generatedSlug: string;
    try {
      generatedSlug = slug(name);
    } catch {
      setError(TEAM_NAME_INVALID);
      return;
    }
    setError(null);
    const tier = tierRef.current?.getValue();
    onSave({
      slug: generatedSlug,
      name: name.trim(),
      colour: colourRef.current?.getValue() ?? '',
      tier: isTier(tier) ? tier : DEFAULT_TIER,
    });
  };

  return {
    nameRef,
    slugRef,
    colourRef,
    tierRef,
    startValues,
    error,
    handleNameChange,
    handleSave,
  };
}
