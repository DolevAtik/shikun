import {
  Award,
  Book,
  BookOpen,
  Briefcase,
  Building,
  Clock,
  FilePlus,
  FileText,
  GraduationCap,
  Home,
  Landmark,
  Lightbulb,
  Link as LinkIcon,
  Map,
  Megaphone,
  Phone,
  Play,
  Receipt,
  ScrollText,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ServiceIcon } from "@moch/contracts";

/** The same names apps/web draws (components/icons.ts), so the preview is what employees see. */
export const SERVICE_ICONS: Record<ServiceIcon, LucideIcon> = {
  award: Award,
  book: Book,
  "book-open": BookOpen,
  briefcase: Briefcase,
  building: Building,
  clock: Clock,
  "file-plus": FilePlus,
  "file-text": FileText,
  "graduation-cap": GraduationCap,
  home: Home,
  landmark: Landmark,
  lightbulb: Lightbulb,
  map: Map,
  megaphone: Megaphone,
  phone: Phone,
  play: Play,
  receipt: Receipt,
  "scroll-text": ScrollText,
  "user-round": UserRound,
  users: Users,
  wallet: Wallet,
};

export function serviceIcon(name: string | null | undefined): LucideIcon {
  return (name && SERVICE_ICONS[name as ServiceIcon]) || LinkIcon;
}
