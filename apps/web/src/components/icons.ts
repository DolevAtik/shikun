import {
  Award,
  BookOpen,
  Book,
  Briefcase,
  Building,
  Clock,
  FilePlus,
  FileText,
  Home,
  Landmark,
  Lightbulb,
  Map,
  Megaphone,
  Phone,
  Play,
  Receipt,
  ScrollText,
  GraduationCap,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon names come from the database as strings, so the admin can pick an icon
 * for a quick link without a code change. Anything unknown falls back at the
 * call site rather than crashing the page.
 */
export const ICONS: Record<string, LucideIcon> = {
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
