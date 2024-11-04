
import { createContext } from "solid-js";
import { CurrentFamily, CurrentUser } from "~/lib/models";
import { createGlobalStore } from "~/lib/store";


export type AppContextValue = {
  user: CurrentUser,
  family: CurrentFamily,
  store: ReturnType<typeof createGlobalStore>
};

export const AppContext = createContext<AppContextValue>({} as any as AppContextValue);

