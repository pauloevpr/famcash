import { DbUser, UncheckedRecord } from "./models";
import { onCleanup } from "solid-js";
import { VoidProps } from "solid-js";
import { idb } from "./idb";
import { sync } from "./server";


export default function ClientSyncService(props: VoidProps<{ user: DbUser }>) {
	let unsubscribe = idb.subscribe(() => triggerSync(props.user))

	onCleanup(() => {
		unsubscribe()
	})

	return (
		<></>
	)
}



let syncing = false
export async function triggerSync(user: DbUser) {
	if (syncing) return
	syncing = true

	try {
		let unsynced = await idb.getUnsynced()
		let unchecked = unsynced.map(item => {
			let record: UncheckedRecord = {
				id: item.id,
				type: item.store,
				deleted: item.deleted === "true",
				data: { ...item }
			}
			// @ts-ignore
			delete item.store
			delete item.unsynced
			delete item.deleted
			record.data = item
			return record
		})

		let syncTimestamp = localStorage.getItem(`syncTimestamp:${user.id}`)
		let { records, syncTimestamp: updatedSyncTimestamp } = await sync(unchecked, syncTimestamp)

		await Promise.all(
			records.map(
				record => {
					record.data.id = record.id
					if (record.deleted) {
						return idb.deleteForever(record.type, record.id)
					} else {
						return idb.set(record.type, record.data, true)
					}
				}
			)
		)

		localStorage.setItem(`syncTimestamp:${user.id}`, updatedSyncTimestamp)

	} finally {
		syncing = false
	}
}
