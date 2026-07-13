/**
 * Demo data for the Employee Experience Platform.
 *
 * The organizational structure is real: five districts, the senior divisions,
 * the administrations, and the subordinate bodies as separate legal entities.
 *
 * The people are not. Every employee here is a fictional persona, and the
 * Director-General's message is published by "לשכת המנכ״ל" rather than by a
 * named individual — we do not put invented words in a real official's mouth.
 */
import { PrismaClient, type District, type Department, type Organization, type User } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

/** Every demo account shares this password. Dev only — obviously. */
const DEMO_PASSWORD = "Moch2026!";

/**
 * Colors are CSS custom properties, not hexes. A district chip is colored text
 * on a tint of itself, and a single hex cannot clear WCAG contrast on both a
 * white card and a dark one — so the theme resolves the color, not the seed.
 */
const DISTRICT_SEED = [
  { code: "NORTH", nameHe: "מחוז צפון", nameEn: "North District", color: "var(--district-north)" },
  { code: "HAIFA", nameHe: "מחוז חיפה", nameEn: "Haifa District", color: "var(--district-haifa)" },
  { code: "CENTER", nameHe: "מחוז מרכז", nameEn: "Center District", color: "var(--district-center)" },
  { code: "JERUSALEM", nameHe: "מחוז ירושלים", nameEn: "Jerusalem District", color: "var(--district-jerusalem)" },
  { code: "SOUTH", nameHe: "מחוז דרום", nameEn: "South District", color: "var(--district-south)" },
] as const;

const DEPARTMENT_SEED = [
  { slug: "finance", kind: "SENIOR_DIVISION", nameHe: "אגף בכיר כספים", nameEn: "Finance" },
  { slug: "digital", kind: "SENIOR_DIVISION", nameHe: "אגף בכיר טכנולוגיות דיגיטליות ומידע", nameEn: "Digital Technologies and Information" },
  { slug: "budget", kind: "SENIOR_DIVISION", nameHe: "אגף בכיר מימון ותקציבים", nameEn: "Funding and Budgets" },
  { slug: "assets", kind: "SENIOR_DIVISION", nameHe: "אגף בכיר נכסים וחברות", nameEn: "Assets and Companies" },
  { slug: "contractors", kind: "SENIOR_DIVISION", nameHe: "אגף בכיר רשם הקבלנים", nameEn: "Registrar of Contractors" },
  { slug: "marketing", kind: "SENIOR_DIVISION", nameHe: "אגף בכיר שיווק", nameEn: "Marketing" },
  { slug: "planning", kind: "SENIOR_DIVISION", nameHe: "אגף בכיר תכנון", nameEn: "Planning" },
  { slug: "buyer-protection", kind: "SENIOR_DIVISION", nameHe: "אגף הגנה על רוכשי דירות", nameEn: "Apartment Buyer Protection" },
  { slug: "minorities", kind: "SENIOR_DIVISION", nameHe: "אגף מיעוטים", nameEn: "Minorities" },
  { slug: "economics", kind: "SENIOR_DIVISION", nameHe: "אגף ניתוח כלכלי", nameEn: "Economic Analysis" },
  { slug: "procurement", kind: "SENIOR_DIVISION", nameHe: "אגף רכש, נכסים ולוגיסטיקה", nameEn: "Procurement and Logistics" },
  { slug: "housing-aid", kind: "ADMINISTRATION", nameHe: "מינהל לסיוע בדיור", nameEn: "Housing Assistance Administration" },
  { slug: "rural", kind: "ADMINISTRATION", nameHe: "מינהל ענייני הכפר", nameEn: "Rural Affairs Administration" },
  { slug: "legal", kind: "BUREAU", nameHe: "הלשכה המשפטית", nameEn: "Legal Bureau" },
] as const;

/**
 * Subordinate bodies are Organizations, not Departments — separate legal
 * entities whose staff may eventually need scoped access.
 */
const ORGANIZATION_SEED = [
  { slug: "moch", nameHe: "משרד הבינוי והשיכון", nameEn: "Ministry of Construction and Housing", isMinistry: true },
  { slug: "rmi", nameHe: "רשות מקרקעי ישראל", nameEn: "Israel Land Authority", isMinistry: false },
  { slug: "amidar", nameHe: "עמידר", nameEn: "Amidar", isMinistry: false },
  { slug: "halamish", nameHe: "חלמיש", nameEn: "Halamish", isMinistry: false },
  { slug: "urban-renewal", nameHe: "הרשות להתחדשות עירונית", nameEn: "Urban Renewal Authority", isMinistry: false },
  { slug: "mapi", nameHe: "המרכז למיפוי ישראל", nameEn: "Survey of Israel", isMinistry: false },
  { slug: "dira-lehaskir", nameHe: "דירה להשכיר", nameEn: "Dira Lehaskir", isMinistry: false },
] as const;

const CHANNEL_SEED = [
  { slug: "organization", nameHe: "הארגון", nameEn: "Organization", descriptionHe: "הודעות רשמיות מהנהלת המשרד", descriptionEn: "Official Ministry announcements", icon: "landmark", color: "var(--brand-blue)", isMandatory: true, order: 0 },
  { slug: "districts", nameHe: "מחוזות", nameEn: "Districts", descriptionHe: "מה קורה בשטח, מכל חמשת המחוזות", descriptionEn: "From all five districts", icon: "map", color: "var(--accent-teal)", isMandatory: false, order: 1 },
  { slug: "projects", nameHe: "פרויקטים", nameEn: "Projects", descriptionHe: "עדכוני בנייה, שיווק ואכלוס", descriptionEn: "Construction and marketing updates", icon: "building", color: "var(--accent-red)", isMandatory: false, order: 2 },
  { slug: "people", nameHe: "אנשים", nameEn: "People", descriptionHe: "עובדים חדשים, מינויים ופרידות", descriptionEn: "New joiners and appointments", icon: "users", color: "var(--accent-green)", isMandatory: false, order: 3 },
  { slug: "leadership", nameHe: "הנהלה", nameEn: "Leadership", descriptionHe: "מסרים מההנהלה הבכירה", descriptionEn: "Messages from senior leadership", icon: "megaphone", color: "var(--brand-navy)", isMandatory: false, order: 4 },
  { slug: "innovation", nameHe: "חדשנות", nameEn: "Innovation", descriptionHe: "יוזמות, ניסויים וכלים חדשים", descriptionEn: "Initiatives and new tools", icon: "lightbulb", color: "var(--accent-violet)", isMandatory: false, order: 5 },
  { slug: "learning", nameHe: "למידה", nameEn: "Learning", descriptionHe: "הדרכות, קורסים והשתלמויות", descriptionEn: "Training and courses", icon: "book", color: "var(--accent-amber)", isMandatory: false, order: 6 },
  { slug: "career", nameHe: "קריירה", nameEn: "Career", descriptionHe: "משרות פנימיות והזדמנויות קידום", descriptionEn: "Internal roles and opportunities", icon: "briefcase", color: "var(--accent-blue)", isMandatory: false, order: 7 },
  { slug: "videos", nameHe: "וידאו", nameEn: "Videos", descriptionHe: "סרטונים מהמשרד ומהשטח", descriptionEn: "Videos from the Ministry", icon: "play", color: "var(--accent-red)", isMandatory: false, order: 8 },
  { slug: "success-stories", nameHe: "סיפורי הצלחה", nameEn: "Success Stories", descriptionHe: "מה עבד, ולמה", descriptionEn: "What worked, and why", icon: "award", color: "var(--accent-green)", isMandatory: false, order: 9 },
] as const;

const HOME_SECTIONS = [
  { type: "GREETING", order: 0 },
  { type: "EMERGENCY", order: 1 },
  { type: "ANNOUNCEMENTS", order: 2 },
  { type: "WEEKLY_SUMMARY", order: 3 },
  { type: "CEO_MESSAGE", order: 4 },
  { type: "KEY_NUMBERS", order: 5 },
  { type: "EVENTS", order: 6 },
  { type: "PROJECTS", order: 7 },
  { type: "VIDEO_OF_WEEK", order: 8 },
  { type: "TRAININGS", order: 9 },
  { type: "CAREERS", order: 10 },
  { type: "BIRTHDAYS", order: 11 },
  { type: "RECOGNITION", order: 12 },
] as const;

const FIRST_NAMES = [
  "נועה", "איתי", "שירה", "יונתן", "מאיה", "עומר", "תמר", "אורי", "ליאת", "רועי",
  "הדס", "אמיר", "יעל", "דניאל", "מיכל", "אלון", "רותם", "גיא", "אביגיל", "נדב",
  "סיון", "ערן", "טל", "אסף", "הילה", "בועז", "ענת", "יובל", "שני", "רן",
  "לינוי", "אדם", "מור", "עידו", "כרמל", "נטע", "יפעת", "משה", "אורית", "סאמר",
  "רים", "חוסאם", "לילך", "ציון", "אביב", "דנה", "ניר", "שקד", "עמית", "גלית",
];

const LAST_NAMES = [
  "כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אברהם", "פרידמן", "שפירא", "אזולאי", "דהן",
  "בר-און", "גולן", "נחמיאס", "אלמוג", "שרון", "רוזן", "טל", "חדד", "אוחיון", "ברקת",
  "סלים", "חורי", "מנסור", "עבאס", "שמעוני", "וייס", "קפלן", "אדרי", "ניסים", "בן-דוד",
];

const TITLES = [
  "רכז/ת תכנון", "מנהל/ת פרויקט", "כלכלן/ית", "יועץ/ת משפטי/ת", "מפקח/ת בנייה",
  "רכז/ת שיווק", "אנליסט/ית נתונים", "מנהל/ת מערכות מידע", "רפרנט/ית תקציב",
  "עובד/ת סוציאלי/ת בדיור", "מהנדס/ת", "רכז/ת הדרכה", "מבקר/ת פנים", "דובר/ת",
];

async function main() {
  console.log("Resetting demo data…");
  await resetAll();

  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  const districts = await seedDistricts();
  const departments = await seedDepartments();
  const organizations = await seedOrganizations();
  const ministry = organizations.find((org) => org.isMinistry)!;

  const users = await seedUsers({ passwordHash, districts, departments, ministry });
  const channels = await seedChannels();

  await seedHomeLayout();
  await seedProjects(districts);
  await seedMetrics();
  await seedQuickLinksAndActions();
  await seedWeeklySummary();
  await seedRecognition(users);
  await seedContent({ users, districts, departments, channels });

  console.log("\nSeed complete.\n");
  printLogins();
}

async function resetAll() {
  // Order matters: children before parents.
  await prisma.commentLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.media.deleteMany();
  await prisma.announcementDetail.deleteMany();
  await prisma.feedPostDetail.deleteMany();
  await prisma.eventDetail.deleteMany();
  await prisma.careerDetail.deleteMany();
  await prisma.trainingDetail.deleteMany();
  await prisma.videoDetail.deleteMany();
  await prisma.ceoMessageDetail.deleteMany();
  await prisma.alertDetail.deleteMany();
  await prisma.contentItem.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.recognition.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.project.deleteMany();
  await prisma.keyMetric.deleteMany();
  await prisma.quickLink.deleteMany();
  await prisma.quickAction.deleteMany();
  await prisma.weeklySummary.deleteMany();
  await prisma.homeSectionConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.district.deleteMany();
  await prisma.organization.deleteMany();
}

async function seedDistricts(): Promise<District[]> {
  return Promise.all(
    DISTRICT_SEED.map((district) => prisma.district.create({ data: { ...district } })),
  );
}

async function seedDepartments(): Promise<Department[]> {
  return Promise.all(
    DEPARTMENT_SEED.map((department) => prisma.department.create({ data: { ...department } })),
  );
}

async function seedOrganizations(): Promise<Organization[]> {
  return Promise.all(
    ORGANIZATION_SEED.map((organization) => prisma.organization.create({ data: { ...organization } })),
  );
}

interface SeedUsersArgs {
  passwordHash: string;
  districts: District[];
  departments: Department[];
  ministry: Organization;
}

async function seedUsers({ passwordHash, districts, departments, ministry }: SeedUsersArgs): Promise<User[]> {
  const byDept = (slug: string) => departments.find((d) => d.slug === slug)!.id;
  const byDistrict = (code: string) => districts.find((d) => d.code === code)!.id;

  const named = [
    // The Director-General's office publishes as an office, not as a person.
    {
      email: "mankal@moch.gov.il",
      firstName: "לשכת",
      lastName: "המנכ״ל",
      title: "מנכ״ל משרד הבינוי והשיכון",
      roles: ["EXECUTIVE", "ADMIN"] as const,
      departmentId: null,
      districtId: null,
    },
    {
      email: "admin@moch.gov.il",
      firstName: "דנה",
      lastName: "אלמוג",
      title: "מנהלת מערכת",
      roles: ["ADMIN"] as const,
      departmentId: byDept("digital"),
      districtId: null,
    },
    {
      email: "editor@moch.gov.il",
      firstName: "יעל",
      lastName: "רוזן",
      title: "עורכת תוכן ארגוני",
      roles: ["CONTENT_EDITOR"] as const,
      departmentId: byDept("digital"),
      districtId: null,
    },
    {
      email: "hr@moch.gov.il",
      firstName: "מיכל",
      lastName: "שפירא",
      title: "מנהלת משאבי אנוש",
      roles: ["HR"] as const,
      departmentId: byDept("procurement"),
      districtId: null,
    },
    {
      email: "haifa.manager@moch.gov.il",
      firstName: "רועי",
      lastName: "ברקת",
      title: "מנהל מחוז חיפה",
      roles: ["DISTRICT_MANAGER"] as const,
      departmentId: byDept("planning"),
      districtId: byDistrict("HAIFA"),
    },
    {
      email: "haifa.employee@moch.gov.il",
      firstName: "עומר",
      lastName: "חדד",
      title: "מפקח בנייה",
      roles: ["EMPLOYEE"] as const,
      departmentId: byDept("planning"),
      districtId: byDistrict("HAIFA"),
    },
    {
      email: "jerusalem.employee@moch.gov.il",
      firstName: "תמר",
      lastName: "בן-דוד",
      title: "רכזת תכנון",
      roles: ["EMPLOYEE"] as const,
      departmentId: byDept("planning"),
      districtId: byDistrict("JERUSALEM"),
    },
    {
      email: "manager@moch.gov.il",
      firstName: "אמיר",
      lastName: "פרידמן",
      title: "מנהל אגף תכנון",
      roles: ["MANAGER"] as const,
      departmentId: byDept("planning"),
      districtId: null,
    },
    {
      email: "employee@moch.gov.il",
      firstName: "נועה",
      lastName: "כהן",
      title: "רפרנטית תקציב",
      roles: ["EMPLOYEE"] as const,
      departmentId: byDept("budget"),
      districtId: null,
    },
  ];

  const users: User[] = [];

  for (const [index, person] of named.entries()) {
    users.push(
      await prisma.user.create({
        data: {
          email: person.email,
          passwordHash,
          firstName: person.firstName,
          lastName: person.lastName,
          title: person.title,
          roles: [...person.roles],
          departmentId: person.departmentId,
          districtId: person.districtId,
          organizationId: ministry.id,
          birthday: birthdayNear(index * 2),
          startedAt: new Date(2019, index % 12, 1),
          bio: null,
          phone: `02-584${String(1000 + index).slice(-4)}`,
        },
      }),
    );
  }

  // The rest of the Ministry: spread across every district and division so that
  // targeting has something to actually target.
  for (let i = 0; i < 55; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length]!;
    const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length]!;
    const department = departments[i % departments.length]!;
    // Roughly a third of staff sit at headquarters, with no district.
    const district = i % 3 === 0 ? null : districts[i % districts.length]!;

    users.push(
      await prisma.user.create({
        data: {
          email: `user${i + 1}@moch.gov.il`,
          passwordHash,
          firstName,
          lastName,
          title: TITLES[i % TITLES.length]!,
          roles: i % 11 === 0 ? ["MANAGER"] : ["EMPLOYEE"],
          departmentId: department.id,
          districtId: district?.id ?? null,
          organizationId: ministry.id,
          birthday: birthdayNear(i - 3),
          startedAt: new Date(2015 + (i % 10), i % 12, ((i * 3) % 27) + 1),
          phone: `02-584${String(2000 + i).slice(-4)}`,
        },
      }),
    );
  }

  return users;
}

/** Spreads birthdays around today so the Home birthdays card is never empty. */
function birthdayNear(offsetDays: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  date.setUTCFullYear(1985 + (Math.abs(offsetDays) % 15));
  return date;
}

async function seedChannels() {
  return Promise.all(CHANNEL_SEED.map((channel) => prisma.channel.create({ data: { ...channel } })));
}

async function seedHomeLayout() {
  await prisma.homeSectionConfig.createMany({
    data: HOME_SECTIONS.map((section) => ({ type: section.type, order: section.order })),
  });
}

async function seedProjects(districts: District[]) {
  const byCode = (code: string) => districts.find((d) => d.code === code)!.id;

  await prisma.project.createMany({
    data: [
      { name: "התחדשות עירונית — קריית אליעזר", city: "חיפה", districtId: byCode("HAIFA"), status: "BUILDING", progress: 62, housingUnits: 840, order: 0 },
      { name: "שכונת הרקפות", city: "כרמיאל", districtId: byCode("NORTH"), status: "MARKETING", progress: 35, housingUnits: 1200, order: 1 },
      { name: "מתחם הרכבת", city: "לוד", districtId: byCode("CENTER"), status: "PLANNING", progress: 15, housingUnits: 2100, order: 2 },
      { name: "פינוי-בינוי גבעת שאול", city: "ירושלים", districtId: byCode("JERUSALEM"), status: "BUILDING", progress: 48, housingUnits: 640, order: 3 },
      { name: "שכונת נווה מדבר", city: "באר שבע", districtId: byCode("SOUTH"), status: "COMPLETED", progress: 100, housingUnits: 950, order: 4 },
      { name: "מתחם התעשייה הישנה", city: "עכו", districtId: byCode("NORTH"), status: "PLANNING", progress: 8, housingUnits: 480, order: 5 },
    ],
  });
}

async function seedMetrics() {
  await prisma.keyMetric.createMany({
    data: [
      { key: "units-marketed", label: "יחידות דיור ששווקו השנה", value: 18400, unit: "יח״ד", changePct: 12.4, period: "מתחילת השנה", order: 0 },
      { key: "permits", label: "היתרי בנייה שאושרו", value: 9250, unit: null, changePct: -3.1, period: "רבעון אחרון", order: 1 },
      { key: "urban-renewal", label: "פרויקטי התחדשות עירונית פעילים", value: 312, unit: null, changePct: 8.0, period: "מתחילת השנה", order: 2 },
      { key: "aid-recipients", label: "משפחות שקיבלו סיוע בדיור", value: 47600, unit: null, changePct: 5.2, period: "מתחילת השנה", order: 3 },
    ],
  });
}

async function seedQuickLinksAndActions() {
  await prisma.quickAction.createMany({
    data: [
      { label: "דיווח שעות", icon: "clock", href: "/services/timesheet", order: 0 },
      { label: "הגשת בקשה", icon: "file-plus", href: "/services/forms", order: 1 },
      { label: "ספר טלפונים", icon: "phone", href: "/services/directory", order: 2 },
      { label: "הרשמה להדרכה", icon: "graduation-cap", href: "/services/training", order: 3 },
      { label: "החזר הוצאות", icon: "receipt", href: "/services/expenses", order: 4 },
      { label: "פנייה למשאבי אנוש", icon: "user-round", href: "/services/hr", order: 5 },
    ],
  });

  await prisma.quickLink.createMany({
    data: [
      { label: "אתר המשרד", url: "https://www.gov.il/he/departments/ministry_of_construction_and_housing", icon: "landmark", isExternal: true, order: 0 },
      { label: "מרכז הידע", url: "/services/knowledge", icon: "book-open", isExternal: false, order: 1 },
      { label: "נהלים ומדיניות", url: "/services/policies", icon: "scroll-text", isExternal: false, order: 2 },
      { label: "טפסים", url: "/services/forms", icon: "file-text", isExternal: false, order: 3 },
      { label: "מערכת שכר", url: "https://example.gov.il/payroll", icon: "wallet", isExternal: true, order: 4 },
      { label: "דירה בהנחה", url: "https://www.dira.moch.gov.il", icon: "home", isExternal: true, order: 5 },
    ],
  });
}

async function seedWeeklySummary() {
  const weekOf = startOfWeek(new Date());
  await prisma.weeklySummary.create({
    data: {
      weekOf,
      title: "השבוע במשרד",
      teaser: "שיווק 1,240 יחידות דיור בצפון, פתיחת מסלול חדש לרוכשי דירה ראשונה, והשקת מערכת רישוי דיגיטלית.",
      highlights: [
        "1,240 יח״ד שווקו במחוז צפון — הרבעון החזק ביותר מזה שנתיים",
        "מסלול חדש לרוכשי דירה ראשונה נכנס לתוקף ב-1 בחודש",
        "מערכת רישוי דיגיטלית עולה לאוויר במחוז חיפה כפיילוט",
        "נפתחה ההרשמה לתוכנית המנטורינג הארגונית",
      ],
    },
  });
}

async function seedRecognition(users: User[]) {
  const pick = (index: number) => users[index % users.length]!;

  await prisma.recognition.createMany({
    data: [
      { recipientId: pick(12).id, badge: "KNOWLEDGE_SHARER", reason: "העבירה סדנה על תכנון סטטוטורי לכל רכזי התכנון במחוזות", awardedAt: daysAgo(2) },
      { recipientId: pick(19).id, badge: "DISTRICT_AMBASSADOR", reason: "חיבר בין מחוז דרום למטה בפרויקט נווה מדבר", awardedAt: daysAgo(5) },
      { recipientId: pick(27).id, badge: "INNOVATION_CHAMPION", reason: "יזם את אוטומציית דוחות הפיקוח שחסכה כ-30 שעות עבודה בחודש", awardedAt: daysAgo(9) },
    ],
  });
}

interface SeedContentArgs {
  users: User[];
  districts: District[];
  departments: Department[];
  channels: { id: string; slug: string }[];
}

async function seedContent({ users, districts, channels }: SeedContentArgs) {
  const mankal = users.find((u) => u.email === "mankal@moch.gov.il")!;
  const editor = users.find((u) => u.email === "editor@moch.gov.il")!;
  const hr = users.find((u) => u.email === "hr@moch.gov.il")!;
  const haifaManager = users.find((u) => u.email === "haifa.manager@moch.gov.il")!;

  const haifa = districts.find((d) => d.code === "HAIFA")!;
  const north = districts.find((d) => d.code === "NORTH")!;
  const south = districts.find((d) => d.code === "SOUTH")!;
  const channel = (slug: string) => channels.find((c) => c.slug === slug)!.id;

  // ── Announcements ─────────────────────────────────────────────────────────
  // Note the third one: targeted at Haifa only. It is the proof that targeting
  // works — a Jerusalem employee must never see it.
  await prisma.contentItem.create({
    data: {
      kind: "ANNOUNCEMENT", status: "PUBLISHED", isPinned: true,
      title: "מסלול חדש לרוכשי דירה ראשונה נכנס לתוקף",
      body: "החל מה-1 בחודש ייכנס לתוקף מסלול סיוע מעודכן לרוכשי דירה ראשונה. המסלול מרחיב את הזכאות ומקצר את זמן הטיפול בבקשה.",
      authorId: editor.id, publishedAt: daysAgo(1),
      announcement: { create: { summary: "הרחבת הזכאות וקיצור זמני הטיפול. הנוהל המלא פורסם במרכז הידע." } },
    },
  });

  await prisma.contentItem.create({
    data: {
      kind: "ANNOUNCEMENT", status: "PUBLISHED",
      title: "מערכת הרישוי הדיגיטלית — פיילוט",
      body: "מערכת הרישוי הדיגיטלית עולה לאוויר כפיילוט. בשלב הראשון היא תשמש את צוותי הפיקוח בלבד.",
      authorId: editor.id, publishedAt: daysAgo(3),
      announcement: { create: { summary: "בשלב הראשון — צוותי פיקוח בלבד. הרחבה למחוזות נוספים ברבעון הבא." } },
    },
  });

  await prisma.contentItem.create({
    data: {
      kind: "ANNOUNCEMENT", status: "PUBLISHED",
      title: "שינוי במיקום משרדי מחוז חיפה",
      body: "החל מהחודש הבא יעברו משרדי המחוז לקומה 4 בבניין הסמוך. מפת הגעה מפורטת נשלחה בדוא״ל.",
      authorId: haifaManager.id, districtId: haifa.id, publishedAt: daysAgo(2),
      audDistrictIds: [haifa.id],
      announcement: { create: { summary: "מעבר לקומה 4 בבניין הסמוך. רלוונטי לעובדי מחוז חיפה בלבד." } },
    },
  });

  // ── Emergency alert ───────────────────────────────────────────────────────
  await prisma.contentItem.create({
    data: {
      kind: "ALERT", status: "PUBLISHED",
      title: "תרגיל חירום ארצי — יום שלישי",
      body: "ביום שלישי בשעה 10:05 יתקיים תרגיל חירום ארצי. יש להתכנס במרחב המוגן בהתאם להנחיות הממונה.",
      authorId: editor.id, publishedAt: daysAgo(0),
      alert: { create: { severity: "WARNING", expiresAt: daysFromNow(4) } },
    },
  });

  // ── Director-General's message ────────────────────────────────────────────
  await prisma.contentItem.create({
    data: {
      kind: "CEO_MESSAGE", status: "PUBLISHED",
      title: "על הקצב שבו אנחנו עובדים",
      body:
        "עמיתות ועמיתים,\n\n" +
        "הרבעון האחרון היה מהעמוסים שידע המשרד. שיווקנו יותר יחידות דיור מבכל רבעון בשנתיים האחרונות, " +
        "ובמקביל הכנסנו לתוקף מסלול סיוע חדש — שני דברים שכל אחד מהם לבדו היה נחשב שנה טובה.\n\n" +
        "אני רוצה לעצור רגע ולומר משהו על האנשים מאחורי המספרים האלה. הם לא קרו בזכות תוכנית עבודה. " +
        "הם קרו כי רכזת תכנון במחוז צפון נשארה לסגור תיק, כי מפקח בחיפה מצא דרך לקצר תהליך, " +
        "וכי מישהו באגף המשפטי ענה לשאלה בשש בערב.\n\n" +
        "המקום הזה, שאתם קוראים בו עכשיו, נבנה כדי שהעבודה הזאת תהיה גלויה. שמה שקורה במחוז אחד ייראה בשני, " +
        "ושלא נצטרך לחכות לישיבת הנהלה כדי לדעת מה הצליח.\n\n" +
        "תודה על העבודה. היא נראית.",
      authorId: mankal.id, publishedAt: daysAgo(4),
      ceoMessage: { create: {} },
    },
  });

  // ── Video of the week ─────────────────────────────────────────────────────
  await prisma.contentItem.create({
    data: {
      kind: "VIDEO", status: "PUBLISHED",
      title: "סיור בפרויקט ההתחדשות בקריית אליעזר",
      body: "ארבע דקות בשטח עם צוות המחוז, מהמגרש ועד המסירה.",
      authorId: editor.id, publishedAt: daysAgo(2),
      video: {
        create: {
          videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
          durationSeconds: 232, viewCount: 418, isVideoOfWeek: true,
        },
      },
    },
  });

  // ── Events ────────────────────────────────────────────────────────────────
  await prisma.contentItem.create({
    data: {
      kind: "EVENT", status: "PUBLISHED",
      title: "יום עיון: התחדשות עירונית 2026",
      body: "יום עיון מקצועי לכלל רכזי התכנון והפיקוח, עם מפגשי עומק לפי מחוז.",
      authorId: hr.id, publishedAt: daysAgo(6),
      event: { create: { startsAt: daysFromNow(5), endsAt: daysFromNow(5), location: "אולם הכנסים, ירושלים", isOnline: false, capacity: 120 } },
    },
  });

  await prisma.contentItem.create({
    data: {
      kind: "EVENT", status: "PUBLISHED",
      title: "מפגש מחוזי — מחוז דרום",
      body: "מפגש עובדי המחוז עם הנהלת המשרד.",
      authorId: hr.id, districtId: south.id, publishedAt: daysAgo(3),
      audDistrictIds: [south.id],
      event: { create: { startsAt: daysFromNow(9), location: "באר שבע", isOnline: false, capacity: 60 } },
    },
  });

  await prisma.contentItem.create({
    data: {
      kind: "EVENT", status: "PUBLISHED",
      title: "וובינר: מה חדש במערכת הרישוי",
      body: "הדגמה חיה של המערכת החדשה, עם זמן לשאלות.",
      authorId: editor.id, publishedAt: daysAgo(1),
      event: { create: { startsAt: daysFromNow(2), isOnline: true, location: null, capacity: null } },
    },
  });

  // ── Trainings ─────────────────────────────────────────────────────────────
  await prisma.contentItem.create({
    data: {
      kind: "TRAINING", status: "PUBLISHED",
      title: "קורס: תכנון סטטוטורי מתקדם",
      body: "ארבעה מפגשים, לרכזי תכנון בכל המחוזות.",
      authorId: hr.id, publishedAt: daysAgo(7),
      training: { create: { startsAt: daysFromNow(12), format: "HYBRID", capacity: 40 } },
    },
  });

  await prisma.contentItem.create({
    data: {
      kind: "TRAINING", status: "PUBLISHED",
      title: "סדנת כתיבה שלטונית נגישה",
      body: "איך כותבים מסמך שאזרח מבין מהקריאה הראשונה.",
      authorId: hr.id, publishedAt: daysAgo(4),
      training: { create: { startsAt: daysFromNow(6), format: "ONLINE", capacity: 100 } },
    },
  });

  // ── Careers ───────────────────────────────────────────────────────────────
  await prisma.contentItem.create({
    data: {
      kind: "CAREER", status: "PUBLISHED",
      title: "מנהל/ת פרויקטים בכיר/ה — אגף תכנון",
      body: "משרה פנימית. ניסיון של 3 שנים לפחות בניהול פרויקטים תכנוניים.",
      authorId: hr.id, publishedAt: daysAgo(5),
      career: { create: { closesAt: daysFromNow(14), isInternal: true } },
    },
  });

  await prisma.contentItem.create({
    data: {
      kind: "CAREER", status: "PUBLISHED",
      title: "אנליסט/ית נתונים — אגף ניתוח כלכלי",
      body: "משרה פנימית. עבודה עם נתוני שיווק ואכלוס ברמה הארצית.",
      authorId: hr.id, publishedAt: daysAgo(8),
      career: { create: { closesAt: daysFromNow(21), isInternal: true } },
    },
  });

  // ── Feed posts ────────────────────────────────────────────────────────────
  const tagIds = await seedTags();

  const posts: {
    channel: string; title: string; body: string; author: User; districtId?: string;
    audDistrictIds?: string[]; tags?: string[]; daysAgo: number; image?: string; alt?: string;
  }[] = [
    {
      channel: "organization", title: "יעדי העבודה לרבעון הקרוב פורסמו",
      body: "תוכנית העבודה לרבעון פורסמה במרכז הידע. שלושה יעדים מרכזיים: קיצור זמני רישוי, הרחבת ההתחדשות העירונית בפריפריה, ושיפור זמינות המידע לאזרח.",
      author: editor, daysAgo: 1, tags: ["תוכנית-עבודה"],
    },
    {
      channel: "districts", title: "מחוז צפון סיים את הרבעון החזק ביותר מזה שנתיים",
      body: "1,240 יחידות דיור שווקו במחוז ברבעון האחרון. הצוות במחוז עבד מול שש רשויות מקומיות במקביל.",
      author: haifaManager, districtId: north.id, daysAgo: 2, tags: ["שיווק", "מחוז-צפון"],
      image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80",
      alt: "מבנה מגורים חדש בבנייה על רקע שמיים בהירים",
    },
    {
      channel: "projects", title: "קריית אליעזר: הושלמה יציקת השלד בבניין הראשון",
      body: "הבניין הראשון במתחם ההתחדשות בקריית אליעזר הגיע לשלב גמר שלד. 840 יחידות דיור במתחם כולו.",
      author: haifaManager, districtId: haifa.id, daysAgo: 3, tags: ["התחדשות-עירונית"],
      image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80",
      alt: "אתר בנייה עם מנוף ובניין בשלבי שלד",
    },
    {
      channel: "innovation", title: "אוטומציה שחוסכת 30 שעות בחודש",
      body: "צוות הפיקוח בנה תהליך אוטומטי שמרכיב את דוח הפיקוח החודשי מתוך הנתונים הקיימים, במקום להקליד אותו מחדש. התהליך נבדק שלושה חודשים ועכשיו נפתח לכל המחוזות.",
      author: editor, daysAgo: 4, tags: ["חדשנות", "אוטומציה"],
    },
    {
      channel: "people", title: "ברוכים הבאים: 12 עובדים ועובדות חדשים הצטרפו החודש",
      body: "החודש הצטרפו למשרד 12 עובדים חדשים, בחמישה אגפים ובארבעה מחוזות. ביום שלישי ייערך מפגש קליטה משותף.",
      author: hr, daysAgo: 5, tags: ["אנשים"],
    },
    {
      channel: "learning", title: "נפתחה ההרשמה לתוכנית המנטורינג",
      body: "התוכנית מחברת עובדים ותיקים עם עובדים חדשים בליווי של חצי שנה. ההרשמה פתוחה לשני הצדדים.",
      author: hr, daysAgo: 6, tags: ["למידה", "מנטורינג"],
    },
    {
      channel: "success-stories", title: "איך קיצרנו את זמן הטיפול בבקשת סיוע מ-21 ל-9 ימים",
      body: "צוות מינהל הסיוע בדיור מיפה את כל שלבי הטיפול בבקשה, מצא ארבעה שלבים שהתבצעו בטור ויכלו להתבצע במקביל, ובנה מחדש את התהליך. התוצאה: זמן טיפול ממוצע של 9 ימים.",
      author: editor, daysAgo: 7, tags: ["סיפור-הצלחה", "שירות"],
    },
    {
      channel: "leadership", title: "סיכום ישיבת ההנהלה החודשית",
      body: "עיקרי הדיון: קצב השיווק בפריפריה, היערכות לתקציב הבא, ומצב יישום מערכת הרישוי הדיגיטלית.",
      author: mankal, daysAgo: 8, tags: ["הנהלה"],
    },
    {
      channel: "districts", title: "מחוז דרום: סיור מנכ״ל בנווה מדבר",
      body: "השכונה אוכלסה במלואה. הסיור כלל מפגש עם ועד השכונה ועם צוות הפיקוח שליווה את הפרויקט מהיום הראשון.",
      author: editor, districtId: south.id, daysAgo: 9, tags: ["מחוז-דרום"],
      image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80",
      alt: "שכונת מגורים חדשה עם בתים ורחוב",
    },
    {
      channel: "videos", title: "שלוש דקות: מה עושה רשם הקבלנים",
      body: "הסבר קצר על עבודת האגף, למי שאף פעם לא היה בטוח.",
      author: editor, daysAgo: 10, tags: ["וידאו"],
    },
  ];

  for (const post of posts) {
    await prisma.contentItem.create({
      data: {
        kind: "FEED_POST", status: "PUBLISHED",
        title: post.title, body: post.body,
        authorId: post.author.id,
        districtId: post.districtId ?? null,
        publishedAt: daysAgo(post.daysAgo),
        audDistrictIds: post.audDistrictIds ?? [],
        feedPost: { create: { channelId: channel(post.channel) } },
        tags: { connect: (post.tags ?? []).map((label) => ({ id: tagIds.get(label)! })) },
        ...(post.image
          ? { media: { create: [{ kind: "IMAGE" as const, url: post.image, alt: post.alt ?? null, order: 0 }] } }
          : {}),
      },
    });
  }

  // A handful of likes and comments, so the feed does not look abandoned.
  const allPosts = await prisma.contentItem.findMany({ where: { kind: "FEED_POST" }, select: { id: true } });
  for (const [index, post] of allPosts.entries()) {
    const likers = users.slice(index, index + 3 + (index % 5));
    for (const liker of likers) {
      await prisma.interaction.create({
        data: { userId: liker.id, contentItemId: post.id, type: "LIKE" },
      });
    }
    if (index % 3 === 0) {
      await prisma.comment.create({
        data: {
          contentItemId: post.id,
          authorId: users[(index + 5) % users.length]!.id,
          body: "תודה על העדכון — שווה להעביר את זה גם לצוותים במחוזות.",
        },
      });
    }
  }
}

async function seedTags(): Promise<Map<string, string>> {
  const labels = [
    "תוכנית-עבודה", "שיווק", "מחוז-צפון", "מחוז-דרום", "התחדשות-עירונית",
    "חדשנות", "אוטומציה", "אנשים", "למידה", "מנטורינג", "סיפור-הצלחה",
    "שירות", "הנהלה", "וידאו",
  ];

  const map = new Map<string, string>();
  for (const label of labels) {
    const tag = await prisma.tag.create({ data: { slug: label, label } });
    map.set(label, tag.id);
  }
  return map;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  // The Israeli work week starts on Sunday.
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

function printLogins() {
  console.log("Demo accounts — password for all: " + DEMO_PASSWORD + "\n");
  const rows = [
    ["mankal@moch.gov.il", "EXECUTIVE + ADMIN", "לשכת המנכ״ל"],
    ["admin@moch.gov.il", "ADMIN", "מטה"],
    ["editor@moch.gov.il", "CONTENT_EDITOR", "מטה"],
    ["hr@moch.gov.il", "HR", "מטה"],
    ["haifa.manager@moch.gov.il", "DISTRICT_MANAGER", "מחוז חיפה"],
    ["haifa.employee@moch.gov.il", "EMPLOYEE", "מחוז חיפה"],
    ["jerusalem.employee@moch.gov.il", "EMPLOYEE", "מחוז ירושלים"],
    ["manager@moch.gov.il", "MANAGER", "מטה"],
    ["employee@moch.gov.il", "EMPLOYEE", "מטה"],
  ];
  for (const [email, role, scope] of rows) {
    console.log(`  ${email.padEnd(32)} ${role.padEnd(20)} ${scope}`);
  }
  console.log(
    "\nTargeting check: haifa.employee sees the Haifa office-move announcement; jerusalem.employee must not.\n",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
