declare global {
	namespace Express {
		interface Request {
			/**
			 * The client's prefered languages, sorted in order of preferation. Please note that
			 * this is a custom field processed and set manually and may not be present in other
			 * Express applications.
			 */
			languages: string[];
			/**
			 * The messages translated to the first language in the client's prefered languages.
			 * Please note that this is a custom field processed and set manually and may not be
			 * present in other Express applications.
			 */

			messages: { [key: string]: string };
		}
		interface Response {
			/**
			 * Technically returns `Response` in basic Express but because of syntax highlighting
			 * problems (async) it can't anymore.
			 */
			send: (data: any) => void;
		}
	}
}

export = {};
