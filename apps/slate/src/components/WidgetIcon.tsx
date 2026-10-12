import {
  Dices,
  Swords,
  FileText,
  BookOpen,
  Users,
  Backpack,
  Table,
  Timer,
  Hash,
  Image,
  ListChecks,
} from "lucide-react";
import type { Widget } from "../model";
export function WidgetIcon({
  kind,
  size = 17,
}: {
  kind: Widget["kind"];
  size?: number;
}) {
  const Icon = {
    table: Table,
    time: Timer,
    counter: Hash,
    image: Image,
    checklist: ListChecks,
    npc: Users,
    items: Backpack,
    dice: Dices,
    initiative: Swords,
    note: FileText,
    reference: BookOpen,
  }[kind];
  return <Icon size={size} />;
}
