function checkRoles(
	userId: string,
	requiredRoles: Array<string>,
	mode: "all" | "some",
): true | Array<string> {
	const member = Bot.guilds.cache
		.get("1125196330646638592")!
		.members.cache.get(userId)!;
	if (!member) return requiredRoles;

	const memberRoles: Array<string> = member.roles.cache.map((role) => role.id);
	if (mode === "all") {
		const invalidMatches = requiredRoles.filter(
			(r) => !memberRoles.includes(r),
		);
		return invalidMatches.length === 0 ? true : invalidMatches;
	} else {
		const match = requiredRoles.filter((r) => memberRoles.includes(r));
		return match.length >= 1 ? true : match;
	}
}

export default checkRoles;
