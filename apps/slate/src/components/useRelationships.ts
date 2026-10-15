import { useEffect, useRef, useState } from "react";
import {
  relationshipCache,
  type CachedRelationship,
} from "../relationship-cache";
import type { Entry } from "../content";

export function useRelationships(campaignId: string, entries: Entry[]) {
  const [rows, setRows] = useState<CachedRelationship[]>([]);
  const [issues, setIssues] = useState<{ source: string; errors: string[] }[]>(
    [],
  );
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const previous = useRef<{
    campaignId: string;
    sources: Map<string, string>;
    revision: number;
  } | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    const sources = new Map(entries.map((entry) => [entry.target, entry.body]));
    if (
      previous.current?.campaignId === campaignId &&
      previous.current.revision === revision &&
      sources.size === previous.current.sources.size &&
      [...sources].every(
        ([target, body]) => previous.current!.sources.get(target) === body,
      )
    )
      return;
    const force = revision > 0 && previous.current?.revision !== revision;
    previous.current = { campaignId, sources, revision };
    const ticket = ++generation.current;
    setLoading(true);
    setError("");
    void relationshipCache
      .sync(campaignId, entries, force)
      .then((result) => {
        if (ticket !== generation.current) return;
        setRows(result.relationships);
        setIssues(result.errors);
        setLoading(false);
      })
      .catch((e) => {
        if (ticket !== generation.current) return;
        previous.current = null;
        setError(
          e instanceof Error
            ? e.message
            : "Unable to update the relationship cache.",
        );
        setLoading(false);
      });
  }, [campaignId, entries, revision]);
  useEffect(
    () => () => {
      generation.current++;
      previous.current = null;
    },
    [],
  );
  return {
    rows,
    issues,
    loading,
    error,
    rebuild: () => {
      setLoading(true);
      setRevision((value) => value + 1);
    },
  };
}
