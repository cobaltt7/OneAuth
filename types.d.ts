export type lighthouseResult = {
	code: string;
	data: {
		url: string;
		emulatedFormFactor: string;
		scores: {
			accessibility: number;
			bestPractices: number;
			performance: number;
			progressiveWebApp: number;
			seo: number;
		};
	}[];
};

interface AuthObj {
	icon: string;
	iconProvider?: "url" | "far" | "fab" | "fas";
	link: string;
	name: string;
	pages?: Page[];
	getData?: (token: string) => Promise<{ [key: string]: string } | undefined | null | void>;
	rawData?: boolean;
}
export type RequestFunction = (
	request: e.Request,
	response: e.Response,
	sendResponse: (tokenOrData: string | { [key: string]: any }, url: string) => Promise<void>,
) => any;
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
export type Auth = AuthObj;
