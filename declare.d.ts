declare module "@replit/database" {
	// https://github.com/replit/database-node/pull/14
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
declare module "@ultraq/icu-message-formatter";
declare module "@tailwindcss/forms";
declare module "@tailwindcss/typography";
declare module "retronid" {
	export = { generate: () => string };
}
