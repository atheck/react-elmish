import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	base: "/react-elmish/",
	plugins: [react()],
	// "react-elmish" is a symlinked npm workspace package pointing at a CommonJS build (dist/index.js).
	// Vite normally skips dep pre-bundling for symlinked/linked packages, which would otherwise serve
	// the raw CJS file to the browser as-is and fail to import; forcing it into the optimizer here
	// converts it to ESM like any other dependency, both in dev and in the production build.
	optimizeDeps: {
		include: ["react-elmish", "react-elmish/immutable"],
	},
	build: {
		commonjsOptions: {
			include: [/react-elmish/, /node_modules/],
		},
	},
});
