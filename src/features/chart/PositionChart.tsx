import type { JSX } from 'preact';
import { Select } from '@/design-system';
import { TeamSwatch, ZoneLegend } from '@/features/components';
import { getMatchdayX, getPlaceY, MIN_MATCHDAY_WIDTH, PLACE_HEIGHT } from './helpers';
import type PositionChartProps from './types';
import type { ChartLine, PositionChartView } from './types';
import { usePositionChart } from './usePositionChart';
import styles from './PositionChart.module.css';

export type { PositionChartProps };

/** The state of a line: it stands out, it fades, or neither. */
const getLineState = (
  line: ChartLine,
  highlight: string | undefined
): 'active' | 'faded' | undefined => {
  if (highlight === undefined) return undefined;
  return line.team === highlight ? 'active' : 'faded';
};

/** The segments between the points of one line, in percent and rem. */
const renderSegments = (
  line: ChartLine,
  matchdays: number,
  className: string
): JSX.Element[] =>
  line.points.slice(1).map((point, i) => {
    const before = line.points[i];
    return (
      <line
        key={point.matchday}
        class={className}
        x1={`${getMatchdayX(before.matchday, matchdays)}%`}
        y1={`${getPlaceY(before.place)}em`}
        x2={`${getMatchdayX(point.matchday, matchdays)}%`}
        y2={`${getPlaceY(point.place)}em`}
        stroke={className === styles.segment ? line.colour : undefined}
      />
    );
  });

const renderLine = (view: PositionChartView, line: ChartLine): JSX.Element => (
  <g
    key={line.team}
    data-team={line.team}
    data-state={getLineState(line, view.highlight)}
    data-outlined={line.outlined ? 'true' : undefined}
    class={styles.line}
    onMouseEnter={() => view.setHighlight(line.team)}
    onMouseLeave={() => view.setHighlight(undefined)}
  >
    {line.outlined && renderSegments(line, view.matchdays, styles.outline)}
    {renderSegments(line, view.matchdays, styles.segment)}
    {line.points.map((point) => (
      <circle
        key={point.matchday}
        class={line.outlined ? styles.outlinedPoint : styles.point}
        cx={`${getMatchdayX(point.matchday, view.matchdays)}%`}
        cy={`${getPlaceY(point.place)}em`}
        r="0.25em"
        fill={line.colour}
        onMouseEnter={() => view.showHint(line, point)}
        onMouseLeave={view.hideHint}
      />
    ))}
  </g>
);

/**
 * The position chart of one phase (US-12.4, Task 156): the place of each
 * team after each matchday with a result, one line for each team in its
 * colour, with the trigram at its end. The chart fills the width of the
 * tab (choice 2). The SVG draws x in percent and y in `em`, and the place
 * numbers and the line ends are HTML columns of the same row height. The
 * zones of the phase are bands behind the lines (Task 190).
 */
export function PositionChart({ league, phaseIndex }: PositionChartProps): JSX.Element {
  const view = usePositionChart(league, phaseIndex);
  const places = Array.from({ length: view.placeCount }, (_, i) => i + 1);
  const plotHeight = view.placeCount * PLACE_HEIGHT;

  return (
    <div class={styles.view}>
      {view.groupOptions && (
        <div class={styles.group}>
          <Select
            label="Group"
            options={view.groupOptions}
            defaultValue="0"
            onChange={view.selectGroup}
          />
        </div>
      )}
      {!view.hasResults ? (
        <p class={styles.note}>The chart shows after the first result.</p>
      ) : (
        <>
          <div class={styles.scroller}>
            <div
              class={styles.chart}
              style={{
                gridTemplateColumns: `auto minmax(${view.matchdays * MIN_MATCHDAY_WIDTH}rem, 1fr) auto`,
              }}
            >
              <div class={styles.places} aria-hidden="true">
                {places.map((place) => (
                  <span
                    key={place}
                    class={styles.row}
                    data-part="place"
                    data-zone={view.getPlaceZone(place)}
                  >
                    {place}
                  </span>
                ))}
              </div>
              <div class={styles.plot}>
                <svg
                  class={styles.svg}
                  role="img"
                  aria-label="Position chart"
                  style={{ height: `${plotHeight}rem` }}
                >
                  {/* The zone bands, behind the grid and the lines (Task 190). */}
                  {view.zones.map((zone) => (
                    <rect
                      key={zone.colour}
                      class={styles.band}
                      data-part="band"
                      data-zone={zone.colour}
                      x="0"
                      width="100%"
                      y={`${(zone.from - 1) * PLACE_HEIGHT}em`}
                      height={`${(Math.min(zone.to, view.placeCount) - zone.from + 1) * PLACE_HEIGHT}em`}
                    />
                  ))}
                  {places.map((place) => (
                    <line
                      key={place}
                      class={styles.grid}
                      x1="0"
                      x2="100%"
                      y1={`${getPlaceY(place)}em`}
                      y2={`${getPlaceY(place)}em`}
                    />
                  ))}
                  {view.lines.map((line) => renderLine(view, line))}
                </svg>
                {/* The x axis: an HTML footer under the plot, at the same
                    percent positions as the points (Task 156 review). */}
                <div class={styles.matchdays} data-part="matchdays" aria-hidden="true">
                  {Array.from({ length: view.matchdays }, (_, i) => (
                    <span
                      key={i}
                      class={styles.matchday}
                      data-part="matchday"
                      style={{ left: `${getMatchdayX(i + 1, view.matchdays)}%` }}
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
                {view.hint && (
                  <span
                    class={styles.hint}
                    role="tooltip"
                    style={{ left: `${view.hint.x}%`, top: `${view.hint.y}rem` }}
                  >
                    {view.hint.text}
                  </span>
                )}
              </div>
              <div class={styles.ends} aria-hidden="true">
                {view.lines.map((line) => (
                  <span
                    key={line.team}
                    class={line.isTrigram ? styles.endTrigram : styles.row}
                    data-part="end"
                  >
                    {line.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <ZoneLegend zones={view.zones} />
          <ul class={styles.legend} aria-label="Teams">
            {view.lines.map((line) => (
              <li key={line.team}>
                <button
                  type="button"
                  class={styles.legendItem}
                  data-state={getLineState(line, view.highlight)}
                  onMouseEnter={() => view.setHighlight(line.team)}
                  onMouseLeave={() => view.setHighlight(undefined)}
                  onFocus={() => view.setHighlight(line.team)}
                  onBlur={() => view.setHighlight(undefined)}
                >
                  <TeamSwatch colour={line.colour} size="sm" />
                  {line.isTrigram && <span class={styles.trigram}>{line.label}</span>}
                  {line.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
PositionChart.displayName = 'PositionChart';
