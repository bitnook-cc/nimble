import { useRef, useState, type InputHTMLAttributes } from "react";
import { Capacitor } from "@capacitor/core";
import { pickFiles } from "../native-files";

/** Keep real browser file inputs; native selection enters the same validation path. */
export function FileInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!Capacitor.isNativePlatform()) return <input {...props} />;
  return (
    <>
      <input {...props} ref={input} hidden />
      <button
        type="button"
        className="secondary"
        disabled={busy || props.disabled}
        onClick={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const files = await pickFiles(!!props.multiple, props.accept);
            if (!files.length) return;
            const transfer = new DataTransfer();
            files.forEach((file) => transfer.items.add(file));
            input.current!.files = transfer.files;
            input.current!.dispatchEvent(
              new Event("change", { bubbles: true }),
            );
          } catch (failure) {
            // Picker cancellation is a normal dismissal, not an import failure.
            const message =
              failure instanceof Error ? failure.message : String(failure);
            if (!/cancel/i.test(message)) setError(message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "Opening files…"
          : props.multiple
            ? "Choose files…"
            : "Choose file…"}
      </button>
      {error && (
        <span role="alert" className="inline-error">
          {error}
        </span>
      )}
    </>
  );
}
