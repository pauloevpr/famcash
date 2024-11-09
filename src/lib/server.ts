"use server"

import { validate } from "./utils";
import { mailer } from "./mailer";
import { db } from "./db";
import { useSession } from "vinxi/http";
import { redirect } from "@solidjs/router";
import { CurrentSession as CurrentAccount, DbRecord, UncheckedFamily, UncheckedRecord, UncheckedUser, UserSession } from "./models";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const SESSION_SECRET = process.env.SESSION_SECRET as string

// TODO: refactor writes so multiple calls happen within the same transaction
// use API like db.transaction(db => { })


export async function getCurrentAccount(): Promise<CurrentAccount> {
	let session = await getSession()
	if (!session.data.id) {
		throw redirect("/login")
	}
	let user = await db.user.get(session.data.id)
	if (!user) {
		session.clear()
		throw redirect("/login")
	}
	let account: CurrentAccount = { user }
	let family = await db.family.forUser(user.id)
	if (family) {
		let users = await db.member.forFamily(family.id)
		account.family = {
			id: family.id,
			name: family.name,
			admin: users.some(member => member.id === user.id && member.admin),
			members: users,
		}
	}
	return account
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

export async function completeSignUpWithNewFamily(userName: string, familyName: string) {
	let { user: { id: userId } } = await getCurrentAccount()
	let existingFamily = await db.family.forUser(userId)
	if (existingFamily) throw Error("user is already member of a family")
	let user: UncheckedUser = { name: userName }
	let family: UncheckedFamily = { name: familyName }
	validate.user(user)
	validate.family(family)
	let { id: familyId } = await db.family.create(userId, family.name)
	await db.member.create(userId, familyId, "admin")
	await db.user.update(userId, user.name)
	throw redirect("/", { revalidate: "user" })
}

export async function completeSignUpWithInvite(userName: string, code: string) {
	let { user: { id: userId } } = await getCurrentAccount()
	let user: UncheckedUser = { name: userName }
	validate.user(user)
	let existingFamily = await db.family.forUser(userId)
	if (existingFamily) throw Error("user is already member of a family")
	let invite = await db.invite.get(code)
	if (!invite) throw Error("Invalid invite")
	let expired = invite.expired_at.getTime() < new Date().getTime()
	if (expired) {
		await db.invite.delete(invite.code)
		throw Error("Invalid invite")
	}
	let membeships = await db.member.forUser(userId)
	let alreadyMember = membeships.some(member => member.family_id === invite.family_id)
	if (alreadyMember) {
		await db.invite.delete(invite.code)
		throw Error("You are already a member of this family")
	}
	await db.user.update(userId, user.name)
	await db.member.create(userId, invite.family_id, "regular", invite.created_by)
	await db.invite.delete(invite.code)
	throw redirect("/", { revalidate: "user" })
}

export async function createInvite(familyId: number) {
	let { user } = await getCurrentAccount()
	await db.member.assureExists(user.id, familyId, true)
	let invite = await db.invite.create(user.id, familyId)
	return invite
}

export async function getInvite(code: string) {
	let { user } = await getCurrentAccount()
	let invite = await db.invite.get(code)
	if (!invite) throw Error("Invalid invite")
	let expired = invite.expired_at.getTime() < new Date().getTime()
	if (expired) {
		await db.invite.delete(invite.code)
		throw Error("Invalid invite")
	}
	let family = await db.family.get(invite.family_id)
	let membeships = await db.member.forUser(user.id)
	return {
		familyName: family.name,
		alreadyMember: membeships.some(member => member.family_id === invite.family_id),
	}
}


export async function sync(
	familyId: number,
	records: UncheckedRecord[],
	syncTimestampRaw: string | null
): Promise<{ records: DbRecord[], syncTimestamp: string }> {
	let { user } = await getCurrentAccount()
	await db.member.assureExists(user.id, familyId)
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


function getSession() {
	return useSession<UserSession>({
		password: SESSION_SECRET,
		maxAge: 30 * 86400, // 86400 = 1 day
		name: "session"
	});
}


