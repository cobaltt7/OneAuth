declare module "retronid" {
	export = { generate: () => string };
}

declare module "live-plugin-manager" {
	export = {
		PluginManager = class {
			install(library: string): Promise<void>;
			require(library: string): any;
		},
	};
}

declare module "@replit/database" {
	export = class Client {
		constructor(key?: string);

		get(key: string, options?: { raw?: boolean }): Promise<any>;
		set(key: string, value: any): Client;
		delete(key: string): Client;
		list(prefix?: string): Promise<string[]>;

		empty(): Client;
		getAll(): Record<any, any>;
		setAll(obj: Record<any, any>): Client;
		deleteMultiple(...args: string[]): Client;
	};
}

declare module "dotenv" {
	export = { config: () => undefined };
}

declare module "util" {
	export = {
		promisify:
			(func1: (...args: any[]) => any) =>
			(...args: any[]) =>
				new Promise<any>(),
	};
}

declare module "highlight.js/lib/languages/*" {
	export = (hljs?: any) => any;
}

declare module "globby" {
	export = (patterns: string | string[]) => new Promise<string[]>();
}

declare module "node-fetch" {
	export = (url: string, opts: any) => new Promise<Response>();
}

declare module "cookie-parser" {
	export = (secret?: string | string[], options?: any) =>
		(
			request: e.Request,
			response: e.Response,
			next: (error?: any) => void,
		) =>
			undefined;
}

declare module "highlight.js/lib/core";
declare module "cheerio";
declare module "@tailwindcss/forms";
declare module "replace-in-file" {
	export = {
		sync: (options: any) =>
			Array<{
				hasChanged: boolean;
				file: string;
			}>(),
	};
}
declare module "@tailwindcss/typography";
declare module "@ultraq/icu-message-formatter";
declare module "fs";
declare module "path";
declare module "url";
