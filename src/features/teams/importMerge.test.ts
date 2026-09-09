import { describe, expect, it } from 'vitest';
import {
  csvRecordToTeamRecord,
  mergeImportedTeams,
  teamRecordToCsvRecord,
} from './importMerge';
import type { TeamRecord } from './types';
import type { TeamCsvRecord } from '../../adapters/csv';

describe('csvRecordToTeamRecord', () => {
  it('keeps a non-blank slug from the CSV row as-is', () => {
    const record: TeamCsvRecord = {
      slug: 'salt-marsh-utd',
      name: 'Salt Marsh United',
      colour: '#039BE5',
      tier: 'A',
    };
    expect(csvRecordToTeamRecord(record).slug).toBe('salt-marsh-utd');
  });

  it('generates a slug from the name when the CSV row has a blank slug', () => {
    const record: TeamCsvRecord = {
      slug: '',
      name: 'Harborview SC',
      colour: '',
      tier: 'B',
    };
    expect(csvRecordToTeamRecord(record).slug).toBe('harborview-sc');
  });
});

describe('teamRecordToCsvRecord', () => {
  it('round-trips a team record into the CSV adapter shape', () => {
    const record: TeamRecord = {
      slug: 'fc-united',
      name: 'FC United',
      colour: '#E53935',
      tier: 'C',
    };
    expect(teamRecordToCsvRecord(record)).toEqual({
      slug: 'fc-united',
      name: 'FC United',
      colour: '#E53935',
      tier: 'C',
    });
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
