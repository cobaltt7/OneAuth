//#region Meta
import { Request, Response, IRouter } from "express";
interface nestedObjStr {
	[key: string]: string | nestedObjStr;
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
	setHeader: (header: string, value: string) => void;
	header: (header: string, value: string) => void;
	header: (headers: { [key: string]: string }) => void;
	set: (header: string, value: string) => void;
	set: (headers: { [key: string]: string }) => void;
	status: (status: number) => ExpressResponse;
	render: (
		view: string,
		options?: { [key: string]: any },
		callback?: MustacheCallback,
	) => IRouter;
	cookie: (name: string, value: string, options: { [key: string] }) => void;
	send: (info: string) => IRouter;
	sendStatus: (status: number) => IRouter;
	json: (info: any) => IRouter;
	redirect: (url: string) => IRouter;
	sendFile: (url: string) => IRouter;
	statusCode: number;
	bodySent: boolean;
}
export interface ExpressRequest extends Request {
	query: { [key: string]: string };
	body: { [key: string]: nestedObjStr };
	languages: string[];
	messages: { [key: string]: string };
	params: { [key: string]: string };
	path: string;
	get: (header: string) => string;
	cookies: { [key: string]: string };
	next: (err: Error | string) => void;
	url: string;
	accepts: (type: string) => boolean;
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
	ExpressResponse,
];
export type Auth = AuthObj;
//#endregion
