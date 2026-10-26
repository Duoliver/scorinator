import { describe, expect, it } from 'vitest';
import { mergeImportedTeams, teamListRecordToTeamRecord } from './importMerge';
import type { TeamRecord } from '@/domain';
import type { TeamListRecord } from '@/persistence/types';

describe('teamListRecordToTeamRecord', () => {
  it('keeps a non-blank slug from the file as is', () => {
    const record: TeamListRecord = {
      slug: 'salt-marsh-utd',
      name: 'Salt Marsh United',
      colour: '#039BE5',
      tier: 'A',
    };
    expect(teamListRecordToTeamRecord(record).slug).toBe('salt-marsh-utd');
  });

  it('generates a slug from the name when the file leaves the slug blank', () => {
    const record: TeamListRecord = {
      slug: '',
      name: 'Harborview SC',
      colour: '',
      tier: 'B',
    };
    expect(teamListRecordToTeamRecord(record).slug).toBe('harborview-sc');
  });
});

describe('mergeImportedTeams', () => {
  const existing: TeamRecord[] = [
    { slug: 'salt-marsh-utd', name: 'Salt Marsh United', colour: '#039BE5', tier: 'A' },
    { slug: 'redbrick-ath', name: 'Redbrick Athletic', colour: '#E53935', tier: 'B' },
  ];

  it('appends an imported team whose slug is new', () => {
    const imported: TeamRecord[] = [
      { slug: 'fc-united', name: 'FC United', colour: '#212121', tier: 'C' },
    ];
    const result = mergeImportedTeams(existing, imported);
    expect(result.map((t) => t.slug)).toEqual([
      'salt-marsh-utd',
      'redbrick-ath',
      'fc-united',
    ]);
  });

  it('overwrites an existing team in place when the imported slug matches', () => {
    const imported: TeamRecord[] = [
      { slug: 'redbrick-ath', name: 'Redbrick Athletic', colour: '#8C1414', tier: 'A' },
    ];
    const result = mergeImportedTeams(existing, imported);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      slug: 'redbrick-ath',
      name: 'Redbrick Athletic',
      colour: '#8C1414',
      tier: 'A',
    });
  });

  it('does not mutate the existing list it was given', () => {
    const imported: TeamRecord[] = [
      { slug: 'fc-united', name: 'FC United', colour: '#212121', tier: 'C' },
    ];
    mergeImportedTeams(existing, imported);
    expect(existing).toHaveLength(2);
  });
});
