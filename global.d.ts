declare global {
	namespace Express {
		interface Request {
			/**
			 * Please note that this is a custom field processed and set manually and will probably
			 * not be present in other Express applications.
			 */
			l10n: {
				/** The client's prefered languages in order of preferation. */
				languages: string[];
				/** The messages translated to the first language in the client's prefered languages. */

				messages: { [key: string]: string };
			};
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
