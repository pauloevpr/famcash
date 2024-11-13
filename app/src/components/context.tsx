
import { createContext } from "solid-js";
import { useFormatter } from "~/lib/intl";
import { CurrentFamily, CurrentUser } from "~/lib/models";


export type AppContextValue = {
  user: CurrentUser,
  family: CurrentFamily,
  formatter: ReturnType<typeof useFormatter>
};

export const AppContext = createContext<AppContextValue>({} as any as AppContextValue);

