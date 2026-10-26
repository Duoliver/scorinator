/** Where the status line sits. Each place has its own spacing and size. */
export type StatusLinePlacement = 'sidebar' | 'page';

export default interface StatusLineProps {
  placement: StatusLinePlacement;
}
