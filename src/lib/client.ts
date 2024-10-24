import { cache, useNavigate, useSearchParams } from "@solidjs/router";
import { getCurrentUser, loginWithToken } from "~/lib/server";
import { idb } from "./idb";
import { clientOnly } from "@solidjs/start"
import { triggerSync } from "./sync";




export const getUser = cache(async () => {
	let navigate = useNavigate()
	let [params, setParams] = useSearchParams()
	if (params.auth_token) {
		await loginWithToken(params.auth_token)
		setParams({ ...params, auth_token: undefined }, { replace: true })
	}
	let user = await getCurrentUser()
	if (user.name) {
		idb.initialize(user.id)
		await triggerSync(user)
	} else {
		navigate("/welcome")
	}
	return user
}, "user")
