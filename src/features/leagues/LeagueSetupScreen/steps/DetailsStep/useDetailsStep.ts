import type { ForwardedRef } from 'preact/compat';
import { useImperativeHandle, useRef, useState } from 'preact/hooks';
import type { FieldHandle } from '@/design-system';
import type { LeagueDraftDetails } from '@/app/state/leagueDraftStore';
import { leagueNameProblem } from '@/features/leagues/LeagueSetupScreen/leagueName';
import type DetailsStepProps from './types';
import type { DetailsStepHandle, DetailsStepState } from './types';
import { parsePoints } from './helpers';

export function useDetailsStep(
  { initial, takenSlugs = [] }: Pick<DetailsStepProps, 'initial' | 'takenSlugs'>,
  ref: ForwardedRef<DetailsStepHandle>
): DetailsStepState {
  const nameRef = useRef<FieldHandle<string>>(null);
  const winRef = useRef<FieldHandle<string>>(null);
  const drawRef = useRef<FieldHandle<string>>(null);
  const lossRef = useRef<FieldHandle<string>>(null);
  const homeAdvantageRef = useRef<FieldHandle<boolean>>(null);
  // Next stays off while the name has a problem (invalid, or taken by an
  // open league), so such a league never reaches Review through Next. The
  // field stays uncontrolled: this copy of the name only feeds the check.
  const [name, setName] = useState(initial.name);

  useImperativeHandle(
    ref,
    () => ({
      getValues: (): LeagueDraftDetails => ({
        name: nameRef.current?.getValue() ?? initial.name,
        points: {
          win: parsePoints(winRef.current?.getValue() ?? '', initial.points.win),
          draw: parsePoints(drawRef.current?.getValue() ?? '', initial.points.draw),
          loss: parsePoints(lossRef.current?.getValue() ?? '', initial.points.loss),
        },
        homeAdvantage: homeAdvantageRef.current?.getValue() ?? initial.homeAdvantage,
      }),
    }),
    [initial]
  );

  return {
    nameRef,
    winRef,
    drawRef,
    lossRef,
    homeAdvantageRef,
    startValues: {
      name: initial.name,
      win: String(initial.points.win),
      draw: String(initial.points.draw),
      loss: String(initial.points.loss),
      homeAdvantage: initial.homeAdvantage,
    },
    nameProblem: leagueNameProblem(name, takenSlugs),
    handleNameChange: setName,
  };
}
