/** @file Output All authentication client manifests. */

import { globby } from "globby";

/** @type {import("../types").Auth[]} */
const authClients = [],
	/** @type {Promise<{ default: import("../types").Auth }>[]} */
	clientPromises = [],
	paths = await globby("src/auth/*/index.js");

for (const filepath of paths) clientPromises.push(import(`../${filepath}`));

for (const { default: client } of await Promise.all(clientPromises)) authClients.push(client);

authClients.sort(({ name: last }, { name: next }) => (next > last ? -1 : next === last ? 0 : 1));

export default authClients;
