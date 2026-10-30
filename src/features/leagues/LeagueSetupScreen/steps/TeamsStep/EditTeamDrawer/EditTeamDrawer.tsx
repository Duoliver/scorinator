import type { JSX } from 'preact';
import { Badge, Button, Drawer, Input } from '@/design-system';
import type { TeamBlueprint } from '@/domain';
import {
  FieldError,
  TeamColourField,
  TeamNameField,
  TeamSwatch,
  TeamTierField,
} from '@/features/components';
import type EditTeamDrawerProps from './types';
import type { TeamInstanceEdit } from './types';
import { useEditTeam } from './useEditTeam';
import styles from './EditTeamDrawer.module.css';

export type { EditTeamDrawerProps, TeamInstanceEdit };

/** The Blueprint as it is in the Teams module, read only (US-08.4). */
function OriginalState({
  blueprint,
}: {
  blueprint: TeamBlueprint | undefined;
}): JSX.Element {
  return (
    <section class={styles.original} aria-label="Original state">
      <h3 class={styles.originalTitle} aria-hidden="true">
        Original state
      </h3>
      {blueprint ? (
        <div class={styles.originalRow}>
          <TeamSwatch colour={blueprint.colour} />
          <span class={styles.originalName}>
            <span>{blueprint.name}</span>
            <span class={styles.muted}>
              {blueprint.slug}
              {blueprint.location !== '' && ` · ${blueprint.location}`}
            </span>
          </span>
          <Badge tone="dark">{blueprint.tier}</Badge>
        </div>
      ) : (
        <p class={styles.muted}>The team was deleted from the Teams module.</p>
      )}
    </section>
  );
}

/** "Edit team for this league": the drawer of one wizard team. A Save
 * changes the Instance only, never the Blueprint (US-08.4, Task 172). */
export function EditTeamDrawer({
  team,
  blueprint,
  fixedTrigram,
  pickedTrigram,
  otherNames,
  otherFixedTrigrams,
  rng,
  onSave,
  onCancel,
}: EditTeamDrawerProps): JSX.Element {
  const edit = useEditTeam({
    team,
    blueprint,
    otherNames,
    otherFixedTrigrams,
    rng,
    onSave,
  });

  return (
    <Drawer title="Edit team for this league" onClose={onCancel}>
      <div class={styles.form}>
        <OriginalState blueprint={blueprint} />

        <TeamNameField
          defaultValue={team.name}
          fieldRef={edit.nameRef}
          error={edit.errors.name}
        />
        <Input label="Slug" defaultValue={team.slug} readOnly />
        <TeamColourField defaultValue={team.colour} fieldRef={edit.colourRef} />
        {/* The Tier and its OVR side by side: a Tier change rolls the OVR
            next to it (Task 172 review). */}
        <div class={styles.pair}>
          <TeamTierField
            defaultValue={team.tier}
            fieldRef={edit.tierRef}
            onChange={edit.handleTierChange}
          />
          <div class={styles.column}>
            <Input
              label={edit.ovrLabel}
              type="number"
              defaultValue={String(team.ovr)}
              ref={edit.ovrRef}
            />
            <FieldError message={edit.errors.ovr} />
          </div>
        </div>

        <Input
          label="Trigram (optional)"
          defaultValue={fixedTrigram ?? ''}
          placeholder={pickedTrigram}
          ref={edit.trigramRef}
        />
        <FieldError message={edit.errors.trigram} />

        <div class={styles.actions}>
          <div class={styles.mainActions}>
            <Button size="sm" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={edit.handleSave}>
              Save
            </Button>
          </div>
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={edit.handleReset}
              disabled={!edit.canReset}
            >
              Reset to original
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
EditTeamDrawer.displayName = 'EditTeamDrawer';
