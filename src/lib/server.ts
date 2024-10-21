"use server"

import { validate } from "./utils";
import { mailer } from "./mailer";
import { db } from "./db";
import { useSession } from "vinxi/http";
import { redirect } from "@solidjs/router";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-devdevdevdevdevdevdevdevdevdevdevdevdevdev"

interface UserSession {
	id?: string
}

export async function getCurrentUser() {
	let session = await getSession()
	if (session.data.id) {
		session.id
		return await db.user.get(session.data.id)
	}
	throw redirect("/login")
}

export async function loginWithToken(token: string) {
	let tokenData = await db.token.get(token)
	if (!tokenData) return false
	let expired = tokenData.expiration.getTime() < new Date().getTime()
	if (expired) {
		await db.token.delete(token)
		return false
	}
	let user = (await db.user.get(tokenData.user_id))!
	let session = await getSession()
	await session.update(data => {
		data.id = user.id
		return data
	})
	await db.token.delete(tokenData.token)
	return true
}

export async function loginWithEmail(email: string) {
	let user = await db.user.get(email)
	if (!user) {
		user = { id: email, nickname: "" }
		validate.user(user)
		await db.user.create(user.id, user.nickname)
	}
	let token = await db.token.create(email)
	let link = new URL(BASE_URL)
	link.searchParams.set("auth_token", token)
	mailer.loginLink(user, link)
}


function getSession() {
	return useSession<UserSession>({
		password: SESSION_SECRET,
		maxAge: 30 * 86400, // 86400 = 1 day
		name: "session"
	});
}

