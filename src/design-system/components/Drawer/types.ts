import type { ComponentChildren } from 'preact';

export default interface DrawerProps {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
}
