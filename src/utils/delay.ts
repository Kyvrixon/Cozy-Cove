const delay = async (t: number): Promise<void> => {
	await new Promise((resolve) => setTimeout(resolve, t));
};
export default delay;
