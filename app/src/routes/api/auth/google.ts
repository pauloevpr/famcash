"use server"

import type { APIEvent } from "@solidjs/start/server";
import { OAuth2Client } from "google-auth-library";
import { getQuery, HTTPEvent, sendRedirect, } from "vinxi/http";
import { db } from "~/lib/db";
import { getSession } from "~/lib/session";
import { validate } from "~/lib/utils";

const env = (key: string): string => {
	let value = process.env[key]
	if (!value) throw Error(`Setting missing: ${key}`)
	return value
}

const settings = {
	clientId: env("GOOGLE_CLIENT_ID"),
	clientSecret: env("GOOGLE_CLIENT_SECRET"),
	redirect: env("GOOGLE_REDIRECT_URI"),
	sessionSecret: env("SESSION_SECRET"),
	scopes: ['https://www.googleapis.com/auth/userinfo.email'],
}

const oauth2Client = () => new OAuth2Client(
	settings.clientId,
	settings.clientSecret,
	settings.redirect
);

export async function GET(event: APIEvent) {
	let query = getQuery(event.nativeEvent)
	let code = query.code
	if (typeof code === "string") {
		return callback(event.nativeEvent, code)
	}
	const url = oauth2Client().generateAuthUrl({ scope: settings.scopes });
	return sendRedirect(event.nativeEvent, url)
}

async function callback(event: HTTPEvent, code: string) {
	let oauth = oauth2Client()
	let { tokens } = await oauth.getToken(code);
	oauth.setCredentials(tokens);
	if (!tokens.id_token) throw Error("Google auth failed: ID token is missing")

	const ticket = await oauth.verifyIdToken({
		idToken: tokens.id_token,
		audience: settings.clientId,
	})
	const payload = ticket.getPayload();
	if (!payload) throw Error("Google auth failed: paiload missing")

	let email = payload.email as string;
	validate.email({ email }, "email")
	let user = await db.user.getByEmail(email)
	if (!user) {
		user = await db.user.create(email, "")
	}
	let session = await getSession()
	await session.update(data => {
		data.id = user.id
		return data
	})
	return sendRedirect(event, "/")
}
