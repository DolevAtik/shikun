import type { CurrentUser, Department, District, Organization, UserSummary } from "@moch/contracts";
import { permissionsFor } from "@moch/contracts";
import type {
  Department as PrismaDepartment,
  District as PrismaDistrict,
  Organization as PrismaOrganization,
  User as PrismaUser,
} from "@prisma/client";

export type UserWithOrg = PrismaUser & {
  department?: PrismaDepartment | null;
  district?: PrismaDistrict | null;
  organization?: PrismaOrganization | null;
};

/** The relations every user-shaped response needs. Kept here so no query forgets one. */
export const USER_INCLUDE = {
  department: true,
  district: true,
  organization: true,
} as const;

export function initialsOf(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

export function toUserSummary(user: UserWithOrg): UserSummary {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    title: user.title,
    avatarUrl: user.avatarUrl,
    initials: initialsOf(user.firstName, user.lastName),
    departmentName: user.department?.nameHe ?? null,
    districtName: user.district?.nameHe ?? null,
  };
}

export function toCurrentUser(user: UserWithOrg): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    title: user.title,
    avatarUrl: user.avatarUrl,
    initials: initialsOf(user.firstName, user.lastName),
    bio: user.bio,
    phone: user.phone,
    birthday: user.birthday ? user.birthday.toISOString() : null,
    startedAt: user.startedAt ? user.startedAt.toISOString() : null,
    roles: user.roles,
    permissions: permissionsFor(user.roles),
    department: user.department ? toDepartment(user.department) : null,
    district: user.district ? toDistrict(user.district) : null,
    organization: user.organization ? toOrganization(user.organization) : null,
    locale: user.locale === "en" ? "en" : "he",
  };
}

export function toDepartment(department: PrismaDepartment): Department {
  return {
    id: department.id,
    slug: department.slug,
    kind: department.kind,
    nameHe: department.nameHe,
    nameEn: department.nameEn,
  };
}

export function toDistrict(district: PrismaDistrict): District {
  return {
    id: district.id,
    code: district.code,
    nameHe: district.nameHe,
    nameEn: district.nameEn,
    color: district.color,
  };
}

export function toOrganization(organization: PrismaOrganization): Organization {
  return {
    id: organization.id,
    slug: organization.slug,
    nameHe: organization.nameHe,
    nameEn: organization.nameEn,
    isMinistry: organization.isMinistry,
  };
}
