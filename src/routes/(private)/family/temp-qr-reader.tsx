import QrScanner from 'qr-scanner';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { Button } from '~/components/buttons';

export default function Temp() {
  let videoRef: HTMLVideoElement | undefined = undefined
  let scanner: QrScanner | undefined = undefined
  let [started, setStarted] = createSignal(false)

  onMount(() => {
    if (!videoRef) return
    scanner = new QrScanner(
      videoRef,
      result => console.log('decoded qr code:', result),
      {
      },
    );
  })

  onCleanup(() => {
    scanner?.destroy()
    scanner = undefined
  })

  function start() {
    setStarted(true)
    scanner?.start()
  }

  function stop() {
    setStarted(false)
    scanner?.stop()
  }

  return (
    <main>
      <video ref={videoRef}>
      </video>
      Invite Page
      <Show when={!started()}>
        <Button label="Start"
          onClick={start}
          style="primary"
        />
      </Show>
      <Show when={started()}>
        <Button label="Stop"
          onClick={stop}
          style="neutral"
        />
      </Show>

    </main>
  )
}
