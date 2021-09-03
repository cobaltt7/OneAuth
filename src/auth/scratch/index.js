/** @file Scratch Authentication handler. */

import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import mongoose from "mongoose";
import "whatwg-fetch";
import retronid from "retronid";

import { logError } from "../../errors/index.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URL || "", {
	appName: "OneAuth",
});

mongoose.connection.on("error", logError);

const Database = mongoose.model(
		"Scratch",
		new mongoose.Schema({
			code: {
				match: /^[\da-z]{10}$/,
				required: true,
				type: String,
				unique: true,
			},

			date: {
				default: Date.now(),
				type: Date,
			},

			nonce: {
				match: /^[\da-z]{10}$/,
				required: true,
				type: String,
				unique: true,
			},
		}),
	),
	directory = path.dirname(fileURLToPath(import.meta.url)),
	/** @type {import("../../../types").Auth} Auth */
	// eslint-disable-next-line sort-vars -- `client` depends on `directory`.
	client = {
		icon: "https://scratch.mit.edu/favicon.ico",

		link: "./scratch?nonce={{ nonce }}",

		name: "Scratch",

		pages: {
			"./scratch": {
				async all(request, response) {
					// Delete any past values that may exist with the same nonce.
					await Database.findOneAndDelete({
						nonce: request.query.nonce,
					});

					const code = retronid();

					await new Database({
						code,
						date: Date.now(),
						nonce: request.query.nonce,
					}).save();

					return response.render(path.resolve(directory, "index.html"), {
						code,
						nonce: request.query.nonce,
					});
				},
			},

			"./scratch/verify": {
				async all(request, response) {
					if (!request.query.nonce) return response.status(400);

					const { code, date } =
						(await Database.findOneAndDelete({
							nonce: request.query.nonce,
						})) || {};

					if (!code || !date) return response.status(403);

					if (new Date() < date + 900000) return response.status(410);

					/**
					 * @type {{
					 * 	id: number;
					 * 	parent_id: null;
					 * 	commentee_id: null;
					 * 	content: string;
					 * 	datetime_created: string;
					 * 	datetime_modified: string;
					 * 	visibility: string;
					 * 	author: {
					 * 		id: number;
					 * 		username: string;
					 * 		scratchteam: boolean;
					 * 		image: string;
					 * 	};
					 * 	reply_count: number;
					 * }[]}
					 */
					const comments = await fetch(
							"https://api.scratch.mit.edu/studios/30228832/comments",
						).then((result) => result.json()),
						// eslint-disable-next-line sort-vars -- `comment` depends on `comments`.
						comment = comments.find(({ content }) => content.includes(code));

					if (!comment) return response.status(401);

					if (new Date(comment.datetime_modified).getTime() < date)
						return response.status(416);

					return this.sendResponse(
						await fetch(
							`https://api.scratch.mit.edu/users/${comment.author.username}`,
						).then((result) => result.json()),
						`${request.query.nonce}`,
					);
				},
			},
		},

		website: "https://scratch.mit.edu/",
	};

export default client;
