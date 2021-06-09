import express = require("express");

declare global {
	declare const __dirname: string;
	declare const process: { argv: string[]; env: { [key: string]: string } };
	declare const require: (library: string) => any;
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
		} & express.Response;
		export type Response = {
			sendStatus: (status: number) => void;
			status: (status: number) => Response;
			render: (
				view: string,
				options?: { [key: string]: any },
				callback?: (err: Error, str: string) => void,
			) => void;
			cookie: (
				name: string,
				value: string,
				options: { [key: string] },
			) => void;
			setHeader: (header: string, value: string) => void;
			readonly statusCode: number;
			json: (info: any) => void;
			bodySent: boolean;
			send: (info: string) => Response;
			redirect: (url: string) => void;
			sendFile: (url: string) => void;
		} & express.Response;
	}
}

export = {};
