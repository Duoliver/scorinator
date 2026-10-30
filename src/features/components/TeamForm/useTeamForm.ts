import { useRef, useState } from 'preact/hooks';
import { DEFAULT_TEAM_COLOUR, type FieldHandle } from '@/design-system';
import { MAX_LOCATION_LENGTH, parseTrigramList, slug } from '@/engine/identity';
import { isTier } from '@/engine/tier-ovr';
import type TeamFormProps from './types';
import type { SlugRegenerate, TeamFormErrors, TeamFormState } from './types';
import {
  DEFAULT_TIER,
  LOCATION_TOO_LONG,
  REGENERATE_HINT,
  SLUG_MATCHES_NAME,
  TEAM_NAME_INVALID,
  getSlugPreview,
  getTrigramsPlaceholder,
  trigramProblemMessage,
} from './helpers';

const NO_ERRORS: TeamFormErrors = { name: null, location: null, trigrams: null };

/** The fields stay uncontrolled: each one keeps its own value, and the
 * hook reads them through their handles on Save. Only the slug preview and
 * the Trigrams placeholder follow the name. The placeholder is state, but
 * it changes only when the name trigram changes, so most keystrokes do not
 * render the form again. */
export function useTeamForm({
  initial,
  takenSlugs = [],
  onSave,
}: Pick<TeamFormProps, 'initial' | 'takenSlugs' | 'onSave'>): TeamFormState {
  const nameRef = useRef<FieldHandle<string>>(null);
  const slugRef = useRef<FieldHandle<string>>(null);
  const colourRef = useRef<FieldHandle<string>>(null);
  const tierRef = useRef<FieldHandle<string>>(null);
  const locationRef = useRef<FieldHandle<string>>(null);
  const trigramsRef = useRef<FieldHandle<string>>(null);
  const [errors, setErrors] = useState<TeamFormErrors>(NO_ERRORS);
  const [trigramsPlaceholder, setTrigramsPlaceholder] = useState(() =>
    getTrigramsPlaceholder(initial?.name ?? '')
  );

  // The regenerate of an edited team: `slugValue` is the slug in the field,
  // `nameSlug` the slug that the name gives, with the `-2` rule and without
  // the team's own saved slug (US-09.5).
  const otherSlugs = initial
    ? takenSlugs.filter((taken) => taken !== initial.slug)
    : [];
  const [slugValue, setSlugValue] = useState(initial?.slug ?? '');
  const [nameSlug, setNameSlug] = useState(() =>
    initial ? getSlugPreview(initial.name, otherSlugs) : ''
  );
  const [confirmingSlug, setConfirmingSlug] = useState(false);

  // An edited team keeps its own colour, even a blank one from an import,
  // so only a new team gets the default.
  const startValues = {
    name: initial?.name,
    slug: initial?.slug,
    colour: initial ? initial.colour : DEFAULT_TEAM_COLOUR,
    tier: initial?.tier ?? DEFAULT_TIER,
    location: initial?.location ?? '',
    trigrams: initial?.trigrams.join(' ') ?? '',
  };

  // An edited team keeps its slug after a rename (US-09.5).
  const handleNameChange = (name: string): void => {
    if (initial) setNameSlug(getSlugPreview(name, otherSlugs));
    else slugRef.current?.setValue(getSlugPreview(name, takenSlugs));
    setTrigramsPlaceholder(getTrigramsPlaceholder(name));
  };

  const regenerate: SlugRegenerate | null = initial
    ? {
        disabled: nameSlug === '' || nameSlug === slugValue,
        hint:
          nameSlug === ''
            ? TEAM_NAME_INVALID
            : nameSlug === slugValue
              ? SLUG_MATCHES_NAME
              : REGENERATE_HINT,
        confirm: confirmingSlug ? { from: slugValue, to: nameSlug } : null,
        open: () => setConfirmingSlug(true),
        apply: (): void => {
          setSlugValue(nameSlug);
          slugRef.current?.setValue(nameSlug);
          setConfirmingSlug(false);
        },
        cancel: () => setConfirmingSlug(false),
      }
    : null;

  const handleSave = (): void => {
    const name = nameRef.current?.getValue() ?? '';
    const location = (locationRef.current?.getValue() ?? '').trim();
    const trigrams = parseTrigramList(trigramsRef.current?.getValue() ?? '');
    let nameSlug: string | null = null;
    try {
      nameSlug = slug(name);
    } catch {
      // The name error below reports it.
    }

    const next: TeamFormErrors = {
      name: nameSlug === null ? TEAM_NAME_INVALID : null,
      location: location.length > MAX_LOCATION_LENGTH ? LOCATION_TOO_LONG : null,
      trigrams: trigrams.ok ? null : trigramProblemMessage(trigrams.problem),
    };
    setErrors(next);
    if (nameSlug === null || !trigrams.ok || next.location !== null) return;

    const tier = tierRef.current?.getValue();
    onSave({
      slug: initial ? slugValue : getSlugPreview(name, takenSlugs),
      name: name.trim(),
      colour: colourRef.current?.getValue() ?? '',
      tier: isTier(tier) ? tier : DEFAULT_TIER,
      location,
      trigrams: trigrams.trigrams,
    });
  };

  return {
    nameRef,
    slugRef,
    colourRef,
    tierRef,
    locationRef,
    trigramsRef,
    startValues,
    errors,
    trigramsPlaceholder,
    regenerate,
    handleNameChange,
    handleSave,
  };
}
