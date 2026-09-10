import { useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Button, Input, Select } from '../../../design-system';
import type { FieldHandle } from '../../../design-system/field';
import { slug } from '../../../engine/identity';
import { TIER_ORDER, type Tier } from '../../../engine/tier-ovr';
import type TeamFormProps from './types';

const TIER_OPTIONS = TIER_ORDER.map((tier) => ({ label: tier, value: tier }));

export function TeamForm({
  title,
  saveLabel,
  initial,
  onCancel,
  onSave,
}: TeamFormProps): JSX.Element {
  const nameRef = useRef<FieldHandle<string>>(null);
  const slugRef = useRef<FieldHandle<string>>(null);
  const colourRef = useRef<FieldHandle<string>>(null);
  const tierRef = useRef<FieldHandle<string>>(null);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (name: string): void => {
    try {
      slugRef.current?.setValue(slug(name));
    } catch {
      slugRef.current?.setValue('');
    }
  };

  const handleSave = (): void => {
    const name = nameRef.current?.getValue() ?? '';
    let generatedSlug: string;
    try {
      generatedSlug = slug(name);
    } catch {
      setError('Enter a team name with at least one letter or number.');
      return;
    }
    setError(null);
    onSave({
      slug: generatedSlug,
      name: name.trim(),
      colour: colourRef.current?.getValue() ?? '',
      tier: (tierRef.current?.getValue() as Tier) || 'C',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem' }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
        {title}
      </h2>

      <Input
        label="Team name"
        defaultValue={initial?.name}
        placeholder="e.g. Salt Marsh United"
        onChange={handleNameChange}
        ref={nameRef}
      />
      {error && (
        <span
          role="alert"
          style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}
        >
          {error}
        </span>
      )}

      <Input
        label="Slug (auto-generated)"
        defaultValue={initial?.slug}
        readOnly
        ref={slugRef}
      />

      <Input
        label="Colour"
        defaultValue={initial?.colour}
        placeholder="#RRGGBB"
        ref={colourRef}
      />

      <Select
        label="Tier"
        defaultValue={initial?.tier ?? 'C'}
        options={TIER_OPTIONS}
        ref={tierRef}
      />

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>{saveLabel}</Button>
      </div>
    </div>
  );
}
TeamForm.displayName = 'TeamForm';
