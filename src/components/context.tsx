
import { createContext } from "solid-js";
import { CurrentFamily, CurrentUser } from "~/lib/models";


export type AppContextValue = {
  user: CurrentUser,
  family: CurrentFamily,
};

export const AppContext = createContext<AppContextValue>({} as any as AppContextValue);

