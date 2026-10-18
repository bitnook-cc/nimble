import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, RefreshCw } from "lucide-react";
import { packKey, type ContentPack } from "../content-schema";
import {
  catalogLocation,
  fetchCatalog,
  fetchCatalogPack,
  catalogUpgrades,
  type CatalogPack,
} from "../pack-catalog";

export function PackCatalog({
  installed,
  busy,
  preview,
  renderInstalled,
}: {
  installed: ContentPack[];
  busy: boolean;
  preview: (pack: ContentPack, signal: AbortSignal) => Promise<void>;
  renderInstalled: (catalog: {
    upgrades: Map<string, CatalogPack>;
    download: (entry: CatalogPack) => Promise<void>;
    disabled: boolean;
    downloading: string | null;
  }) => ReactNode;
}) {
  const [catalog, setCatalog] = useState<CatalogPack[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const operation = useRef<AbortController | null>(null);
  const available = catalog.filter(
    (entry) => !installed.some((pack) => pack.id === entry.id),
  );
  useEffect(() => {
    const active = new AbortController();
    operation.current = active;
    const timeout = setTimeout(() => active.abort(), 20000);
    setLoading(true);
    setError("");
    void Promise.resolve()
      .then(() => fetchCatalog(catalogLocation(), active.signal))
      .then((packs) => {
        if (!active.signal.aborted) setCatalog(packs);
      })
      .catch(() => {
        if (operation.current === active)
          setError(
            "The pack catalog is unavailable. Connect to the internet and retry. Installed packs remain available offline.",
          );
      })
      .finally(() => {
        clearTimeout(timeout);
        if (operation.current === active) setLoading(false);
      });
    return () => {
      operation.current = null;
      active.abort();
    };
  }, [revision]);
  useEffect(
    () => () => {
      operation.current?.abort();
      operation.current = null;
    },
    [],
  );
  async function download(entry: CatalogPack) {
    operation.current?.abort();
    const active = new AbortController();
    operation.current = active;
    const timeout = setTimeout(() => active.abort(), 30000);
    setDownloading(packKey(entry));
    setError("");
    setMessage("");
    try {
      const pack = await fetchCatalogPack(entry, active.signal);
      if (operation.current !== active || active.signal.aborted) return;
      await preview(pack, active.signal);
      if (operation.current === active && !active.signal.aborted)
        setMessage("Preview ready below. Nothing has been installed yet.");
    } catch (e) {
      if (operation.current === active)
        setError(
          active.signal.aborted
            ? "Download cancelled or timed out. Nothing was installed."
            : e instanceof Error
              ? e.message
              : "Download failed. Nothing was installed.",
        );
    } finally {
      clearTimeout(timeout);
      if (operation.current === active) setDownloading(null);
    }
  }
  return (
    <>
      <section aria-label="Available content packs" className="pack-catalog">
        <div className="content-actions">
          <h3>Available to install</h3>
          <button
            className="quiet icon-button"
            aria-label="Refresh pack catalog"
            disabled={loading || !!downloading || busy}
            onClick={() => setRevision((r) => r + 1)}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <p className="hint">
          Optional downloads. Preview before installing; installed packs work
          offline and can be enabled separately in each campaign.
        </p>
        {loading && <p role="status">Loading pack catalog…</p>}
        {available.map((entry) => (
          <article className="pack-row" key={packKey(entry)}>
            <strong>{entry.name}</strong>
            <p>{entry.description}</p>
            <p className="hint">
              {entry.records.toLocaleString()} records ·{" "}
              {(entry.bytes / 1024 / 1024).toFixed(1)} MB · SRD{" "}
              {entry.source.revision}
            </p>
            <button
              className="secondary"
              disabled={loading || !!downloading || busy}
              onClick={() => void download(entry)}
            >
              <Download size={16} aria-hidden="true" />{" "}
              {downloading === packKey(entry) ? "Downloading…" : "Preview pack"}
            </button>
            <details>
              <summary>Attribution</summary>
              <p>{entry.source.license}</p>
              <a
                href={entry.source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Source document
              </a>
            </details>
          </article>
        ))}
        {!!downloading && (
          <button className="quiet" onClick={() => operation.current?.abort()}>
            Cancel download
          </button>
        )}
        {!loading && !error && available.length === 0 && (
          <p>
            {catalog.length === 0
              ? "No downloadable packs are listed."
              : "All listed packs are already installed."}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
      </section>
      {renderInstalled({
        upgrades: catalogUpgrades(catalog, installed),
        download,
        disabled: loading || !!downloading || busy,
        downloading,
      })}
    </>
  );
}
