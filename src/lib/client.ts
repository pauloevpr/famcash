import { cache, useNavigate, useSearchParams } from "@solidjs/router";
import { getCurrentUser, loginWithToken } from "~/lib/server";

export const getUser = cache(async () => {
	let navigate = useNavigate()
	let [params, setParams] = useSearchParams()
	if (params.auth_token) {
		await loginWithToken(params.auth_token)
		setParams({ ...params, auth_token: undefined }, { replace: true })
	}
	let user = await getCurrentUser()
	if (!user.name) {
		navigate("/welcome")
	}
	return user
}, "user")
