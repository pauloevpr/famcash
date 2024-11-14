import { useSession } from "vinxi/http";
const SESSION_SECRET = process.env.SESSION_SECRET as string

export interface UserSession {
	id?: number
}

export function getSession() {
	return useSession<UserSession>({
		password: SESSION_SECRET,
		maxAge: 30 * 86400, // 86400 = 1 day
		name: "session"
	});
}
