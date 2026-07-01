import nodeWithBiome from "eslint-config-heck/nodeWithBiome";

// biome-ignore lint/style/noDefaultExport: Required for ESLint
export default [
	...nodeWithBiome,
	{
		rules: {
			"unicorn/consistent-boolean-name": "off",
			"unicorn/prefer-type-literal-last": "off",
			"react/no-class-component": "off",
		},
	},
];
