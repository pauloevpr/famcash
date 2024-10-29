"use server"

import { validate } from "./utils";
import { mailer } from "./mailer";
import { db } from "./db";
import { useSession } from "vinxi/http";
import { redirect } from "@solidjs/router";
import { CurrentSession as CurrentAccount, DbFamily, DbRecord, DbUser, UncheckedFamily, UncheckedRecord, UncheckedUser } from "./models";



const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-devdevdevdevdevdevdevdevdevdevdevdevdevdev"

interface UserSession {
	id?: number
}


export async function getCurrentAccount(): Promise<CurrentAccount> {
	let session = await getSession()
	if (session.data.id) {
		let user = await db.user.get(session.data.id)
		if (!user) {
			session.clear()
			throw redirect("/login")
		}
		let account: CurrentAccount = { user }
		// TODO: this should be a single call in the database: type: MemberWithFamily
		let memberships = await db.member.getAllForUser(user.id)
		let member = memberships[0]
		if (member) {
			let family = await db.family.get(member.family_id)
			if (family) {
				account.family = {
					id: family.id,
					name: family.name,
					admin: member.admin
				}
			}
		}
		return account
	}
	throw redirect("/login")
}

export async function logout() {
	let session = await getSession()
	session.clear()
	throw redirect("/login")
}

export async function signupWithToken(token: string) {
	let tokenData = await db.token.signup.get(token)
	if (!tokenData) return false
	let expired = tokenData.expiration.getTime() < new Date().getTime()
	if (expired) {
		await db.token.signup.delete(token)
		return false
	}
	let user = await db.user.getByEmail(tokenData.email)
	if (user) {
		await db.token.signup.delete(token)
		throw Error("user already signed up")
	}
	user = await db.user.create(tokenData.email, "")
	await db.token.signup.delete(token)
	let session = await getSession()
	await session.update(data => {
		data.id = user.id
		return data
	})
	return true
}

export async function loginWithToken(token: string) {
	let tokenData = await db.token.login.get(token)
	if (!tokenData) {
		return false
	}
	let expired = tokenData.expiration.getTime() < new Date().getTime()
	if (expired) {
		await db.token.login.delete(token)
		return false
	}
	let user = (await db.user.get(tokenData.user_id))!
	let session = await getSession()
	await session.update(data => {
		data.id = user.id
		return data
	})
	await db.token.login.delete(tokenData.token)
	return true
}


export async function loginWithEmail(email: string) {
	validate.email({ email }, "email")
	let user = await db.user.getByEmail(email)
	if (user) {
		let token = await db.token.login.create(user.id)
		let link = new URL(BASE_URL)
		link.searchParams.set("login_token", token)
		mailer.loginLink(user, link)
	} else {
		let token = await db.token.signup.create(email)
		let link = new URL(BASE_URL)
		link.searchParams.set("signup_token", token)
		mailer.signupLink(email, link)
	}
}

export async function finishSignup(userName: string, familyName: string) {
	let { user: { id: userId } } = await getCurrentAccount()
	let user: UncheckedUser = { name: userName }
	let family: UncheckedFamily = { name: familyName }
	validate.user(user)
	validate.family(family)
	let { id: familyId } = await db.family.create(userId, family.name)
	await db.member.create(userId, familyId, "admin")
	await db.user.update(userId, user.name)
	throw redirect("/", { revalidate: "user" })
}

export async function sync(
	familyId: number,
	records: UncheckedRecord[],
	syncTimestampRaw: string | null
): Promise<{ records: DbRecord[], syncTimestamp: string }> {
	let { user } = await getCurrentAccount()
	await assureUserHasPermissions(user, familyId)
	let syncTimestamp: Date
	try {
		syncTimestamp = new Date(syncTimestampRaw || '2000-01-01')
	} catch (e) {
		console.error(`parsing timestamp with value '${syncTimestampRaw}' failed: ${e}`)
		syncTimestamp = new Date('2000-01-01')
	}
	for (let record of records) {
		validate.record(record)
		await db.record.upsert(
			familyId,
			user.id,
			record.id,
			record.type,
			record.deleted,
			record.data,
		)
	}
	let updated = await db.record.upatedSince(familyId, syncTimestamp)
	let timestamp = updated[0]?.updated_at.toISOString() || syncTimestamp.toISOString()
	return { records: updated, syncTimestamp: timestamp }
}

async function assureUserHasPermissions(user: DbUser, familyId: number) {
	let memberships = await db.member.getAllForUser(user.id)
	let hasPermission = memberships.some(
		membership => membership.family_id === familyId
	)
	if (!hasPermission) {
		// TODO: figure out if solid has a built-in way to raise errors
		throw Error("access denied")
	}
}

export function getSession() {
	return useSession<UserSession>({
		password: SESSION_SECRET,
		maxAge: 30 * 86400, // 86400 = 1 day
		name: "session"
	});
}


