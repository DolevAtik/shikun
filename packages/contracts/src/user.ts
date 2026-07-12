import { z } from "zod";
import { DepartmentSchema, DistrictSchema, OrganizationSchema } from "./org";
import { PermissionSchema, RoleSchema } from "./roles";

/** The compact user shape embedded in posts, comments and directory rows. */
export const UserSummarySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  title: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  initials: z.string(),
  departmentName: z.string().nullable(),
  districtName: z.string().nullable(),
});
export type UserSummary = z.infer<typeof UserSummarySchema>;

/** The full profile of the signed-in user. */
export const CurrentUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  title: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  initials: z.string(),
  bio: z.string().nullable(),
  phone: z.string().nullable(),
  birthday: z.string().nullable(),
  startedAt: z.string().nullable(),
  roles: z.array(RoleSchema),
  permissions: z.array(PermissionSchema),
  department: DepartmentSchema.nullable(),
  district: DistrictSchema.nullable(),
  organization: OrganizationSchema.nullable(),
  locale: z.enum(["he", "en"]),
});
export type CurrentUser = z.infer<typeof CurrentUserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email("כתובת דוא״ל לא תקינה"),
  password: z.string().min(1, "נדרשת סיסמה"),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const LoginResponseSchema = z.object({
  tokens: AuthTokensSchema,
  user: CurrentUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
