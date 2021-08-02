/** @file Mongoose Connection handling and schemas. */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { logError } from "../src/errors/index.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URL || "", {
	appname: "Email Auth",
	useCreateIndex: true,
	useFindAndModify: false,
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

export const database = mongoose.connection;

database.on("error", logError);

export const AuthDatabase = mongoose.model(
		"Auth",
		new mongoose.Schema({
			token: {
				type: String,
				required: true,
				unique: true,
				match: /^[a-z0-9]{10}$/,
			},
			data: {
				type: {}, // todo: make a standard
				required: true,
			},
		}),
	),
	EmailDatabase = mongoose.model(
		"Email",
		new mongoose.Schema({
			code: {
				type: String,
				required: true,
				unique: true,
				match: /^[a-z0-9]{10}$/,
			},
			email: {
				type: String,
				required: true,
				match: /^(?=[a-z0-9@.!#$%&'*+/=?^_'{|}~-]{6,254}$)(?=[a-z0-9.!#$%&'*+/=?^_'{|}~-]{1,64}@)[a-z0-9!#$%&'*+/=?^_'{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_'{|}~-]+)*@(?:(?=[a-z0-9-]{1,63}\.)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?=[a-z0-9-]{1,63}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/gim,
			},
			date: {
				type: Date,
				default: Date.now(),
			},
		}),
	);
