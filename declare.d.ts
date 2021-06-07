declare module "retronid" {
	export = { generate: () => string };
}
declare module "@tailwindcss/forms";
declare module "@tailwindcss/typography";
declare module "@ultraq/icu-message-formatter";
declare module "live-plugin-manager" {
	export = {
		install: (library: string) => new Promise<void>(),
		require: (library: string) => any,
	};
}
declare module "fs";
declare module "url";
declare module "path";
declare module "dotenv";
declare module "util" {
	export = {
		promisify:
			(func: (...args: any[]) => any) =>
			(...args: any[]) =>
				new Promise<any>(),
	};
}
declare module "highlight.js/lib/core";
declare module "globby" {
	export = (patterns: string | string[]) => new Promise<string[]>();
}

declare const __dirname: string;
declare const process: { argv: string[]; env: { [key: string]: string } };
declare const require: (library: string) => any;
