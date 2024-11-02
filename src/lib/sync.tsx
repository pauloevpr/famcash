import { UncheckedRecord } from "./models";
import { onCleanup, onMount, useContext } from "solid-js";
import { sync } from "./server";
import { AppContext, AppContextValue } from "~/components/context";


export default function ClientSyncService() {
	let context = useContext(AppContext)
	let unsubscribe = context.store.idb.subscribe(() => triggerSync(context))
	onCleanup(() => {
		unsubscribe()
	})
	onMount(() => {
		triggerSync(context)
	})
	return (
		<></>
	)
}

let syncing = false
export async function triggerSync(context: AppContextValue) {
	if (syncing) return
	syncing = true

	try {
		let user = context.user
		let family = context.family
		let unsynced = await context.store.idb.getUnsynced()
		let unchecked = unsynced.map(item => {
			let record: UncheckedRecord = {
				id: item.id,
				type: item.type,
				deleted: item.deleted === "true",
				data: { ...item.data }
			}
			return record
		})

		let syncTimestamp = localStorage.getItem(`syncTimestamp:${user.id}`)
		let { records, syncTimestamp: updatedSyncTimestamp } = await sync(family.id, unchecked, syncTimestamp)

		await Promise.all(
			records.map(
				record => {
					record.data.id = record.id
					if (record.deleted) {
						return context.store.idb.delete(record.type, record.id)
					} else {
						return context.store.idb.set(
							record.type,
							{ ...record.data, id: record.id },
							true
						)
					}
				}
			)
		)

		localStorage.setItem(`syncTimestamp:${user.id}`, updatedSyncTimestamp)

	} finally {
		syncing = false
	}
}
