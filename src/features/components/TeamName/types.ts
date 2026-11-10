export default interface TeamNameProps {
  name: string;
  /** The Location of the Blueprint, or `''`: the hint of the name. */
  location: string;
  /** The league trigram, or `''`. With a trigram, the markup also holds
   * the trigram for a narrow box. The screen CSS picks one. */
  trigram?: string;
}
