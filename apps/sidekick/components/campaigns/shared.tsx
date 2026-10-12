"use client";

import { campaigns } from "@nimble/shared";

import { FormEvent, ReactElement, ReactNode, cloneElement, isValidElement, useId } from "react";

export type CampaignProps = {
  view: campaigns.CampaignView;
  userId: string;
  busy: boolean;
  command: (command: campaigns.Command) => Promise<boolean>;
};
export const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="grid gap-1.5 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ id: string }>, { id })
        : children}
    </div>
  );
}
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
export function formValues(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  return new FormData(event.currentTarget);
}
export const string = (data: FormData, key: string) => String(data.get(key) ?? "");
export const number = (data: FormData, key: string) => Number(data.get(key));
export const uid = () => crypto.randomUUID();
export function describe(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return value.map(describe).join("; ");
  return Object.entries(value)
    .filter(([key]) => key !== "id")
    .map(([key, v]) => `${key}: ${describe(v)}`)
    .join(" · ");
}
