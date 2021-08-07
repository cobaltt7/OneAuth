import type { Request, Response } from "express";

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

export type Auth = {
	link: string; //
	name: string; //
	pages?: Page[];
	getData?: (
		token: string,
	) =>
		| Promise<{ [key: string]: string } | undefined | null | void>
		| { [key: string]: string }
		| undefined
		| null
		| void;
	rawData?: boolean;
	icon: string; //
	fontAwesome?: "far" | "fab" | "fas"; //
	website?: string;
};
export type RequestFunction = (
	request: Request,
	response: Response,
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

export type StructuredMessage = {
	character_limit?: number;
	context?: string;
	developer_comment?: string;
	string: string;
	[key: string]: undefined;
};

export type StructuredJSON = {
	[key: string]:
		| {
				[key: string]: StructuredJSON | StructuredMessage | undefined;

				string: undefined;
				character_limit: undefined;
				context: undefined;
				developer_comment: undefined;
		  }
		| StructuredMessage;
};
