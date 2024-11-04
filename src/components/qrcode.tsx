import QRCode from "qrcode";
import QrScanner from 'qr-scanner';
import { VoidProps, createResource, onCleanup, onMount, } from 'solid-js';
import { Button } from '~/components/buttons';
import { QRCodeIcon } from "./icons";

export function QRCodeBar(props: VoidProps<{ text: string }>) {
  let [url] = createResource(() => props.text, (text) => {
    return QRCode.toDataURL(text)
  })
  return (
    <img src={url()} alt="QR Code"
      class="w-full h-full "
    />
  )
}

export default function QRCodeScanner(props: VoidProps<{
  title: string,
  description: string,
  onResult: (text: string) => void,
  onCancel: Function
}>) {
  let videoRef: HTMLVideoElement | undefined = undefined
  let scanner: QrScanner | undefined = undefined

  onMount(() => {
    if (!videoRef) return
    scanner = new QrScanner(
      videoRef,
      result => props.onResult(result.data),
      {},
    );
    scanner.start()
  })

  onCleanup(() => {
    scanner?.destroy()
    scanner = undefined
  })

  function cancel() {
    scanner?.stop()
    props.onCancel()
  }

  return (
    <dialog open
      class="fixed top-0 left-0 w-screen h-screen bg-white overflow-y-auto"
    >
      <div class="mx-auto max-w-xl py-16 px-6">
        <QRCodeIcon class="w-10 h-10 mx-auto text-primary" />
        <div class="pb-6 pt-4" >
          <h1 class="block text-xl text-center font-medium">
            {props.title}
          </h1>
          <p class="text-light text-center">
            {props.description}
          </p>
        </div>
        <video ref={videoRef}
          class="rounded-xl border-2 border-dashed border-primary min-h-160 w-full"
        >
        </video>
        <div class="pt-8">
          <Button style="neutral"
            label="Cancel"
            type="button"
            onClick={cancel}
          />
        </div>
      </div>
    </dialog>
  )
}
