/** Which installations made and last changed an entity (US-11.1). Each
 * value is an installation UUID. A Blueprint and a League carry these
 * fields. An Instance does not, because it is not an exported entity of its
 * own. The app never shows them, and they never decide an identity. */
export interface Provenance {
  createdByInstallation: string;
  lastModifiedByInstallation: string;
}
