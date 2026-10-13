import { useState } from "react";
import { ImportPreviewContent, ReferenceBody } from "./ContentWorkspace";
import type { ImportPreview } from "../exchange";

export function ImportRecordList({ preview }: { preview: ImportPreview }) {
  const [expanded, setExpanded] = useState<string[]>(
    preview.records[0] ? [preview.records[0].id] : [],
  );
  return (
    <>
      <div className="content-actions">
        <button
          className="quiet"
          onClick={() => setExpanded(preview.records.map((r) => r.id))}
        >
          Expand all previews
        </button>
        <button className="quiet" onClick={() => setExpanded([])}>
          Collapse previews
        </button>
      </div>
      <ImportPreviewContent records={preview.records} pack={preview.pack}>
        <ul
          className="exchange-records exchange-import-records"
          aria-label="Records to import"
        >
          {preview.records.map((record) => (
            <li key={record.id}>
              <details
                open={expanded.includes(record.id)}
                onToggle={(event) => {
                  const open = event.currentTarget.open;
                  setExpanded((current) =>
                    open === current.includes(record.id)
                      ? current
                      : open
                        ? [...current, record.id]
                        : current.filter((id) => id !== record.id),
                  );
                }}
              >
                <summary>
                  {record.title} · {record.kind}
                  {record.fields.incomplete ? " · Incomplete statblock" : ""}
                </summary>
                {expanded.includes(record.id) && (
                  <div className="exchange-record-preview">
                    <ReferenceBody
                      entry={{
                        ...record,
                        target: `local::${record.id}`,
                        pack: preview.pack,
                      }}
                      preview
                      sections={false}
                    />
                  </div>
                )}
              </details>
            </li>
          ))}
        </ul>
      </ImportPreviewContent>
    </>
  );
}
