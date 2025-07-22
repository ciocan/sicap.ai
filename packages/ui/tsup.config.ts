import { type Options, defineConfig } from "tsup";

export default defineConfig((options: Options) => ({
	treeshake: true,
	splitting: true,
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	minify: true,
	clean: false,
	// clean: true,
	banner: {
		js: '"use client";',
	},
	external: ["react", "lucide-react"],
	...options,
}));
