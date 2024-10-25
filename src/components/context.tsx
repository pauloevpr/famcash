
import { createContext } from "solid-js";
import { SignedInUser } from "~/lib/models";


export type SignedInUserContextValue = { user: SignedInUser };
export const SignedInUserContext = createContext<SignedInUserContextValue>({} as any as SignedInUserContextValue);

