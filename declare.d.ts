declare module "retronid" {
	export = { generate: () => string };
}
declare module "@tailwindcss/forms";
declare module "@tailwindcss/typography";
declare module "@ultraq/icu-message-formatter";
declare module "fs";
declare module "url";
declare module "path";
declare module "util";
declare module "highlight.js";

declare var __dirname: string;
declare var process: { argv: string[]; env: { [key: string]: string } };
declare var require: (library: string) => any;
