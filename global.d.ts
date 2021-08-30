declare global {
	namespace Express {
		interface Request {
			/**
			 * Please note that this is a custom field processed and set manually and will probably
			 * not be present in other Express applications.
			 */
			localization: {
				/** The client's prefered languages in order of preferation. */
				languages: string[];
				/** The messages translated to the first language in the client's prefered languages. */
				messages: { [key: string]: string };
			};
		}
		interface Response {
			/**
			 * Please note that this is a custom field processed manually and will probably not be
			 * present in other Express applications.
			 *
			 * @param code The HTTP error code to send.
			 * @param message - A message to send along with the error information.
			 */
			sendError(code: number, message: string): this;

			_status(code: number): this;
			/**
			 * @returns - Technically returns `Response` in basic Express but since syntax
			 *   highlighting has to be asyncronous, it can't anymore.
			 * @todo: make it return a promise?
			 */
			send: (data: any) => void;
		}
	}
}

export {};
