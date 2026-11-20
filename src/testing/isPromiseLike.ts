function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
	// biome-ignore lint/nursery/noUnsafeTypeAssertion: We check whether the value has a then function.
	return typeof (value as Partial<PromiseLike<unknown>> | null | undefined)?.then === "function";
}

export { isPromiseLike };
