import { PermissionsBitField, PermissionsString } from "discord.js";

type NonAdminPermissions = Exclude<PermissionsString, "Administrator">;

/**
 * Checks if the given PermissionsBitField has any of the required permissions.
 * @param perms The PermissionsBitField to check.
 * @param requiredPerms The required permissions.
 * @param mode If "some", checks if any of the required permissions are present.
 * @returns true if any of the required permissions are present, false if none of them are.
 */
function permCheck(
	perms: Readonly<PermissionsBitField>,
	requiredPerms: NonAdminPermissions[],
	mode: "some",
): boolean;

/**
 * Checks if the given PermissionsBitField has all the required permissions.
 * @param perms The PermissionsBitField to check.
 * @param requiredPerms The required permissions.
 * @param mode If "all", checks if all the required permissions are present. If "some", checks if any of the required permissions are present.
 * @returns An array of the missing permissions.
 */
function permCheck(
	perms: Readonly<PermissionsBitField>,
	requiredPerms: NonAdminPermissions[],
	mode: "all",
): Array<string>;

/**
 * Checks if the given PermissionsBitField has all or some of the required permissions.
 * @param perms The PermissionsBitField to check.
 * @param requiredPerms The required permissions.
 * @param mode If "all", checks if all the required permissions are present. If "some", checks if any of the required permissions are present.
 * @returns If mode is "all", returns an array of the missing permissions. If mode is "some", returns true if any of the required permissions are present, false if none of them are.
 */
function permCheck(
	perms: Readonly<PermissionsBitField>,
	requiredPerms: NonAdminPermissions[],
	mode: "all" | "some",
): boolean | true | Array<string> {
	if (mode === "all") {
		return perms.missing(requiredPerms, true);
	} else {
		return perms.any(requiredPerms, true);
	}
}

export default permCheck;
