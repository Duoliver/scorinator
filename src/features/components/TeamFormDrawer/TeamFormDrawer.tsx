import type { JSX } from 'preact';
import { Drawer } from '@/design-system';
import { TeamForm } from '@/features/components/TeamForm';
import type TeamFormDrawerProps from './types';

/** `Drawer` + `TeamForm`, wired for the create/edit title and save-label
 * pair both callers need — so a screen only decides *whether* it is
 * editing, not what that means for copy. */
export function TeamFormDrawer({
  isEdit = false,
  initial,
  onCancel,
  onSave,
}: TeamFormDrawerProps): JSX.Element {
  return (
    <Drawer title={isEdit ? 'Edit team' : 'New team'} onClose={onCancel}>
      <TeamForm
        key={isEdit ? `edit-${initial?.slug}` : 'create'}
        saveLabel={isEdit ? 'Save changes' : 'Create team'}
        initial={initial}
        onCancel={onCancel}
        onSave={onSave}
      />
    </Drawer>
  );
}
TeamFormDrawer.displayName = 'TeamFormDrawer';
