export interface SwatchOption {
  /** The accessible name of the swatch, for example `Red`. */
  label: string;
  /** A CSS colour, for example `#E53935`. Matched ignoring case. */
  value: string;
}

export default interface SwatchPickerProps {
  label: string;
  options: readonly SwatchOption[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  id?: string;
}
