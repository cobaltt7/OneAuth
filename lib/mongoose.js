/** @file Mongoose Connection handling and schemas. */

import dotenv from "dotenv";
import mongoose from "mongoose";

import { logError } from "../src/errors/index.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URL || "", {
	appName: "OneAuth",
});

export const database = mongoose.connection;

database.on("error", logError);

export const EmailItem = mongoose.model(
		"Email",
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

			email: {
				match: /^(?=[\w!#$%&'*+./=?@^{|}~\-]{6,254}$)(?=[\w!#$%&'*+./=?^{|}~\-]{1,64}@)[\w!#$%&'*+/=?^{|}~\-]+(?:\.[\w!#$%&'*+/=?^{|}~\-]+)*@(?:(?=[\da-z\-]{1,63}\.)[\da-z](?:[\da-z\-]*[\da-z])?\.)+(?=[\da-z\-]{1,63}$)[\da-z](?:[\da-z\-]*[\da-z])?$/gim,
				required: true,
				type: String,
			},

			nonce: {
				match: /^[\da-z]{10}$/,
				required: true,
				type: String,
				unique: true,
			},
		}),
	),
	NonceItem = mongoose.model(
		"Nonce",
		new mongoose.Schema({
			nonce: {
				match: /^[\da-z]{10}$/,
				required: true,
				type: String,
				unique: true,
			},

			psuedoNonce: {
				match: /^[\da-z]{10}$/,
				required: true,
				type: String,
				unique: true,
			},

			redirect: {
				required: true,
				type: String,
			},
		}),
	);
