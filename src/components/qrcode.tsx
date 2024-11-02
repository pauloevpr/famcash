import QRCode from "qrcode";
import { VoidProps, createResource } from "solid-js";

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
