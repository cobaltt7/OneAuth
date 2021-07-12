declare global {
	declare const __dirname: string | undefined;
	declare const __filename: string | undefined;
	declare const process: {
		argv: string[];
		env: { [key: string]: string };
		exit: (code?: number) => undefined;
	};
	declare const require: undefined | ((library: string) => any);
	namespace Express {
		interface Request {
			// 	path: string;
			// 	body?: { [key: string]: string | { [key: string]: string } };
			// 	query?: { [key: string]: string };
			// 	params?: { [key: string]: string };
			// 	cookies?: { [key: string]: string };
			// 	get: (header: string) => string | undefined;
			/**
			 * The client's prefered languages, sorted in order of preferation. Please note that
			 * this is a custom field processed and set manually and may not be present in other
			 * Express applications.
			 */
			languages: string[];
			// 	accepts: (type: string) => boolean;
			/**
			 * The messages translated to the first language in the client's prefered languages.
			 * Please note that this is a custom field processed and set manually and may not be
			 * present in other Express applications.
			 */

			messages: { [key: string]: string };
		}
		interface Response {
			// 	sendStatus: (status: number) => undefined;
			// 	status: (status: number) => Response;
			// 	render: (
			// 		view: string,
			// 		options?: { [key: string]: any },
			// 		callback?: (error: Error, str: string) => undefined,
			// 	) => undefined;
			// 	cookie: (name: string, value: string, options: { [key: string] }) => undefined;
			// 	setHeader: (header: string, value: string) => undefined;
			// 	readonly statusCode: number;
			// 	json: (info: any) => undefined;
			// 	headersSent: boolean;

			/**
			 * Technically returns `Response` in basic Express but because of syntax highlighting
			 * problems (async) it can't anymore.
			 */
			send: (data: any) => void;

			// 	redirect: (url: string | URL) => undefined;
			// 	sendFile: (path: string) => undefined;
		}
	}
}

export = {};
