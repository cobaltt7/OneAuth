import express from "express";

declare global {
	declare const __dirname: string;
	declare const process: {
		argv: string[];
		env: { [key: string]: string };
		exit: (code?: number) => void;
	};
	declare const require: (library: string) => any;
	declare namespace e {
		export type Request = {
			path: string;
			body?: { [key: string]: string | { [key: string]: string } };
			query?: { [key: string]: string };
			params?: { [key: string]: string };
			cookies?: { [key: string]: string };
			get: (header: string) => string | void;
			languages: string[];
			accepts: (type: string) => boolean;
			messages: { [key: string]: string };
		} & express.Request;
		export type Response = {
			sendStatus: (status: number) => void;
			status: (status: number) => Response;
			render: (
				view: string,
				options?: { [key: string]: any },
				callback?: (error: Error, str: string) => void,
			) => void;
			cookie: (
				name: string,
				value: string,
				options: { [key: string] },
			) => void;
			setHeader: (header: string, value: string) => void;
			readonly statusCode: number;
			json: (info: any) => void;
			headersSent: boolean;
			// Technically returns `Response` in basic Express but because of syntax highlighting problems (async) it can't anymore.
			send: (info: string) => void;
			redirect: (url: string) => void;
			sendFile: (url: string) => void;
		} & express.Response;
	}
}

export = {};
