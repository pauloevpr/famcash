import { cache, useNavigate, useSearchParams } from "@solidjs/router";
import { getCurrentUser, loginWithToken, signupWithToken } from "~/lib/server";
import { idb } from "./idb";
import { triggerSync } from "./sync";
import { SignedInUser } from "./models";


export const getUser = cache(async () => {
	let navigate = useNavigate()
	let [params, setParams] = useSearchParams()
	if (params.login_token) {
		await loginWithToken(params.login_token)
		setParams({ ...params, login_token: undefined }, { replace: true })
	} else if (params.signup_token) {
		await signupWithToken(params.signup_token)
		setParams({ ...params, signup_token: undefined }, { replace: true })
	}
	let user: SignedInUser | Response = await getCurrentUser()
	if (user.id) {
		idb.initialize(`${user.id}:${user.activeProfile.id}`)
		await triggerSync(user)
		if (!user.name) {
			navigate("/welcome")
		}
	}
	return user
}, "user")
