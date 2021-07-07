import express from "express";

declare global {
	declare const __dirname: string | undefined;
	declare const __filename: string | undefined;
	declare const process: {
		argv: string[];
		env: { [key: string]: string };
		exit: (code?: number) => undefined;
	};
	declare const require: undefined | ((library: string) => any);
	declare namespace e {
		export type Request = {
			path: string;
			body?: { [key: string]: string | { [key: string]: string } };
			query?: { [key: string]: string };
			params?: { [key: string]: string };
			cookies?: { [key: string]: string };
			get: (header: string) => string | undefined;
			languages: string[];
			accepts: (type: string) => boolean;
			messages: { [key: string]: string };
		} & express.Request;
		export type Response = {
			sendStatus: (status: number) => undefined;
			status: (status: number) => Response;
			render: (
				view: string,
				options?: { [key: string]: any },
				callback?: (error: Error, str: string) => undefined,
			) => undefined;
			cookie: (name: string, value: string, options: { [key: string] }) => undefined;
			setHeader: (header: string, value: string) => undefined;
			readonly statusCode: number;
			json: (info: any) => undefined;
			headersSent: boolean;

			// Technically returns `Response` in basic Express but because of syntax highlighting problems (async) it can't anymore.
			send: (info: string) => undefined;

			redirect: (url: string | URL) => undefined;
			sendFile: (path: string) => undefined;
		} & express.Response;
	}
}

export = {};
