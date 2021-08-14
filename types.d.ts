import type { Request, Response, NextFunction } from "express";

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
	link: string;
	name: string;
	pages: { [key: string]: Page };
	icon: string;
	fontAwesome?: "far" | "fab" | "fas";
	website?: string;
};

export function SendResponse(
	tokenOrData: { [key: string]: any },
	nonce: string,
): Promise<Response | void>;

export function RequestFunction(
	this: {
		sendResponse: SendResponse;
	},
	request: Request,
	response: Response,
	next: NextFunction,
): unknown;
export interface Page {
	"all"?: typeof RequestFunction;
	"checkout"?: typeof RequestFunction;
	"copy"?: typeof RequestFunction;
	"delete"?: typeof RequestFunction;
	"get"?: typeof RequestFunction;
	"head"?: typeof RequestFunction;
	"lock"?: typeof RequestFunction;
	"merge"?: typeof RequestFunction;
	"mkactivity"?: typeof RequestFunction;
	"mkcol"?: typeof RequestFunction;
	"move"?: typeof RequestFunction;
	"m-search"?: typeof RequestFunction;
	"notify"?: typeof RequestFunction;
	"options"?: typeof RequestFunction;
	"patch"?: typeof RequestFunction;
	"post"?: typeof RequestFunction;
	"purge"?: typeof RequestFunction;
	"put"?: typeof RequestFunction;
	"report"?: typeof RequestFunction;
	"search"?: typeof RequestFunction;
	"subscribe"?: typeof RequestFunction;
	"trace"?: typeof RequestFunction;
	"unlock"?: typeof RequestFunction;
	"unsubscribe"?: typeof RequestFunction;
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
