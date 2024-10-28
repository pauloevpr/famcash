
import { createContext } from "solid-js";
import { CurrentFamily, CurrentUser } from "~/lib/models";
import { createStore } from "~/lib/store";


export type AppContextValue = {
  user: CurrentUser,
  family: CurrentFamily,
  store: ReturnType<typeof createStore>
};

export const AppContext = createContext<AppContextValue>({} as any as AppContextValue);

