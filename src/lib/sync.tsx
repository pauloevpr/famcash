import { UncheckedRecord } from "./models";
import { onCleanup, onMount, useContext } from "solid-js";
import { sync } from "./server";
import { AppContext, AppContextValue } from "~/components/context";


export default function ClientSyncService() {
	let context = useContext(AppContext)
	let syncing = false
	let unsubscribe = context.store.idb.listenToUnsyncedChanges(() => {
		triggerSync(context)
	})

	onMount(() => {
		triggerSync(context)
	})


	async function triggerSync(context: AppContextValue) {
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

			let updated = records.filter(record => !record.deleted)
			await context.store.idb.setMany(
				updated.map(record => [record.type, { ...record.data, id: record.id }])
				, true)

			let deleted = records.filter(record => record.deleted)
			await context.store.idb.deleteMany(
				deleted.map(record => [record.type, record.id])
			)

			localStorage.setItem(`syncTimestamp:${user.id}`, updatedSyncTimestamp)

		} finally {
			syncing = false
		}
	}

	onCleanup(() => {
		unsubscribe?.()
	})

	return (
		<></>
	)
}

