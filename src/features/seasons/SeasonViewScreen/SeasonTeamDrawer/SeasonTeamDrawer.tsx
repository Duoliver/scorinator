import type { JSX } from 'preact';
import { Button, Drawer, Input } from '@/design-system';
import {
  FieldError,
  TeamColourField,
  TeamNameField,
  TeamTierField,
} from '@/features/components';
import type SeasonTeamDrawerProps from './types';
import { useSeasonTeamDrawer } from './useSeasonTeamDrawer';
import styles from './SeasonTeamDrawer.module.css';

export type { SeasonTeamDrawerProps };

/** "Edit Season team": the drawer of one Season team (US-13.4). A change
 * reaches every league of the Season, so the note names them. */
export function SeasonTeamDrawer({
  team,
  leagueNames,
  otherNames,
  otherTrigrams,
  rng,
  onSave,
  onCancel,
}: SeasonTeamDrawerProps): JSX.Element {
  const edit = useSeasonTeamDrawer({
    team,
    leagueNames,
    otherNames,
    otherTrigrams,
    rng,
    onSave,
  });

  return (
    <Drawer title="Edit Season team" onClose={onCancel}>
      <div class={styles.form}>
        <p class={styles.note}>{edit.note}</p>
        <TeamNameField
          defaultValue={team.name}
          fieldRef={edit.nameRef}
          error={edit.errors.name}
        />
        <Input label="Slug" defaultValue={team.slug} readOnly />
        <TeamColourField defaultValue={team.colour} fieldRef={edit.colourRef} />
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
        <div class={styles.column}>
          <Input label="Trigram" defaultValue={team.trigram} ref={edit.trigramRef} />
          <FieldError message={edit.errors.trigram} />
        </div>
        <div class={styles.actions}>
          <Button size="sm" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={edit.handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
SeasonTeamDrawer.displayName = 'SeasonTeamDrawer';
