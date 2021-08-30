import type { Request, Response, NextFunction } from "express";

export interface AllContributosRc {
	projectName?: string;
	projectOwner?: string;
	repoType?: string;
	repoHost?: string;
	files?: string[];
	imageSize?: number[];
	commit?: boolean;
	commitConvention?: string;
	contributorsPerLine?: number;
	contributorsSortAlphabetically?: boolean;
	badgeTemplate?: string;
	contributorTemplate?: string;
	skipCi?: boolean;
	types: {
		[key: string]: {
			symbol: string;
			description: string;
			link: string;
		};
	};
	contributors?: {
		login: string;
		name: string;
		avatar_url: string;
		profile: string;
		contributions: string[];
	}[];
}

export interface Commit {
	sha: string;
	node_id: string;
	commit: {
		author: Committer;
		committer: Committer;
		message: string;
		tree: {
			sha: string;
			url: string;
		};
		url: string;
		comment_count: number;
		verification: {
			verified: boolean;
			reason: string;
			signature: string;
			payload: string;
		};
	};
	url: string;
	html_url: string;
	comments_url: string;
	author: Pusher;
	committer: Pusher;
	parents: {
		sha: string;
		url: string;
		html_url: string;
	}[];
	stats: {
		total: number;
		additions: number;
		deletions: number;
	};
	files: {
		sha: string;
		filename: string;
		status: string;
		additions: number;
		deletions: number;
		changes: number;
		blob_url: string;
		raw_url: string;
		contents_url: string;
		patch: string;
	}[];
}

interface Pusher {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
}

interface Committer {
	name: string;
	email: string;
	date: string;
}

export type Auth = {
	link: string;
	name: string;
	pages: { [key: string]: Page };
	icon: string;
	fontAwesome?: "far" | "fab" | "fas";
	website?: string;
	disabled?: boolean;
};

export function SendResponse(data: { [key: string]: any }, nonce: string): Promise<Response | void>;

export function RequestFunction(
	this: {
		sendResponse: typeof SendResponse;
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
