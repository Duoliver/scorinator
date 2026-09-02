export interface TabItem {
  id: string;
  label: string;
}

export default interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}
