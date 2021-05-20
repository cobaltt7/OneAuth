//#region Meta
import { Request, Response, IRouter } from "express";
interface nestedObjStr {
	[key: string]: string | nestedObjStr;
}
interface JSON {
	[key: string]: JSON | string | number | null | boolean | Array<json>;
}
//#endregion

//#region Mustache
export type MustacheCallback = (err: Error, str: string) => void;
//#endregion

//#region Express
export interface ExpressResponse extends Response {
	setHeader: (header: string, value: string) => any;
	header: (header: string, value: string) => any;
	header: (headers: { [key: string]: string }) => any;
	set: (header: string, value: string) => any;
	set: (headers: { [key: string]: string }) => any;
	status: (status: number) => ExpressResponse;
	render: (
		view: string,
		options?: any,
		callback?: MustacheCallback,
	) => IRouter;
	cookie: (name: string, value: string, options: { [key: string] }) => void;
	send: (info: string) => IRouter;
	json: (info: JSON) => IRouter;
	redirect: (url: string) => IRouter;
	sendFile: (url: string) => IRouter;
}
export type ExpressNext = () => void;
export interface ExpressRequest extends Request {
	query: { [key: string]: string };
	body: { [key: string]: nestedObjStr };
	languages: string[];
	messages: { [key: string]: string };
	params: { [key: string]: string };
	path: string;
	get: (header: string) => string;
	cookies: { [key: string]: string };
	next: ([err]: Error | string) => void;
	url: string;
}
//#endregion

//#region Auth
interface AuthObj {
	icon: string;
	iconProvider?: "svg" | "url" | "far" | "fab" | "fas";
	link: string;
	name: string;
	pages?: Page[];
	getData: (token: string) => Promise<{ [key: string]: string }>;
	rawData: boolean;
}
type RequestFunction = (
	req: ExpressRequest,
	res: ExpressResponse,
	sendResponse: (
		tokenOrData: string | Object,
		url: string,
		res: ExpressResponse,
	) => IRouter,
) => Promise<void>;
export interface Page {
	"backendPage": string;
	// "all"?: RequestFunction;
	"checkout"?: RequestFunction;
	"copy"?: RequestFunction;
	"delete"?: RequestFunction;
	"get"?: RequestFunction;
	"head"?: RequestFunction;
	"lock"?: RequestFunction;
	"merge"?: RequestFunction;
	"mkactivity"?: RequestFunction;
	"mkcol"?: RequestFunction;
	"move"?: RequestFunction;
	"m-search"?: RequestFunction;
	"notify"?: RequestFunction;
	"options"?: RequestFunction;
	"patch"?: RequestFunction;
	"post"?: RequestFunction;
	"purge"?: RequestFunction;
	"put"?: RequestFunction;
	"report"?: RequestFunction;
	"search"?: RequestFunction;
	"subscribe"?: RequestFunction;
	"trace"?: RequestFunction;
	"unlock"?: RequestFunction;
	"unsubscribe"?: RequestFunction;
}
export type sendResponseArgs = [
	string | { [key: string]: string },
	string,
	import("../../types").ExpressResponse,
];
export type Auth = AuthObj;
//#endregion
