const formatSeconds = (
	seconds: number,
	options: {
		includeZeroUnits?: boolean;
		onlyUnits?: Array<"y" | "w" | "d" | "h" | "m" | "s">;
		format?: "long" | "short";
	},
) => {
	const { includeZeroUnits, onlyUnits, format } = options ?? {
		includeZeroUnits: false,
		format: "long",
		onlyUnits: [],
	};

	if (typeof seconds === "string") {
		seconds = parseInt(seconds as string);
	}

	seconds = Math.ceil(seconds);

	const unitsToDisplay =
		onlyUnits && Array.isArray(onlyUnits) && onlyUnits.length > 0
			? onlyUnits
			: ["y", "w", "d", "h", "m", "s"];

	const units = [
		{ value: 365 * 24 * 60 * 60, labels: ["year", "y"] },
		{ value: 7 * 24 * 60 * 60, labels: ["week", "w"] },
		{ value: 24 * 60 * 60, labels: ["day", "d"] },
		{ value: 60 * 60, labels: ["hour", "h"] },
		{ value: 60, labels: ["minute", "m"] },
		{ value: 1, labels: ["second", "s"] },
	];

	let remaining = seconds;
	const parts: string[] = [];

	for (const { value, labels } of units) {
		const shortLabel = labels[1];

		if (!unitsToDisplay.includes(shortLabel)) continue;

		const count = Math.floor(remaining / value);
		remaining %= value;

		if (
			count > 0 ||
			(includeZeroUnits && unitsToDisplay.includes(shortLabel))
		) {
			if (format === "short") {
				parts.push(`${count}${shortLabel}`);
			} else {
				const label = count === 1 ? labels[0] : `${labels[0]}s`;
				parts.push(`${count} ${label}`);
			}
		} else if (includeZeroUnits && unitsToDisplay.includes(shortLabel)) {
			if (format === "short") {
				parts.push(`0${shortLabel}`);
			} else {
				const label = shortLabel === "s" ? "second" : `${shortLabel}s`;
				parts.push(`0 ${label}`);
			}
		}
	}

	if (parts.length === 0 && unitsToDisplay.length > 0) {
		return unitsToDisplay.map((unit) => `0 ${unit}`).join(", ");
	}

	let output = "";

	if (format === "long") {
		output =
			parts.length === 1
				? parts[0]
				: parts.slice(0, -1).join(", ") + " and " + parts.slice(-1);
	} else {
		output = parts.join(" ");
	}

	return output.trim();
};

export default formatSeconds;
