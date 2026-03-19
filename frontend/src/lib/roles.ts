import type { UserRole } from "@/lib/types";

const internalRoles: UserRole[] = [
  "supervisor_of_verificator",
  "verificator",
  "supervisor_of_investigator",
  "investigator",
  "director",
  "system_administrator",
];

export function isReporter(role?: string | null): role is "reporter" {
  return role === "reporter";
}

export function isInternalRole(role?: string | null): role is UserRole {
  return internalRoles.includes(role as UserRole);
}

export function isSystemAdministrator(role?: string | null): role is "system_administrator" {
  return role === "system_administrator";
}

export function roleHomePath(role?: string | null): string {
  if (role === "reporter") {
    return "/submit";
  }

  if (role === "system_administrator") {
    return "/admin";
  }

  if (role && isInternalRole(role)) {
    return "/workflow";
  }

  return "/";
}
