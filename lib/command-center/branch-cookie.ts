export const BRANCH_COOKIE_NAME = "saloniq_selected_branch";

export function resolveSelectedBranchId(
  branches: { id: string }[],
  cookieValue: string | undefined
): string | null {
  if (branches.length === 0) return null;
  if (branches.length === 1) return branches[0].id;
  if (cookieValue && branches.some((branch) => branch.id === cookieValue)) {
    return cookieValue;
  }
  return branches[0].id;
}

export function setSelectedBranchCookie(branchId: string): void {
  document.cookie = `${BRANCH_COOKIE_NAME}=${branchId}; path=/; max-age=31536000`;
}
