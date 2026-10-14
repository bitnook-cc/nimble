import { expect, it } from "vitest";
import { appSchema, newApp, newTool } from "./model";
import { fitWidget, widgetTypes } from "./widgets";
import { copyCampaign } from "./campaigns";
import { encodeBackup, decodeBackup } from "./backup";
import { newNote } from "./notes";

it("every widget kind permits one-cell placements through validation, copying and portable backup", async () => {
  const app = newApp(),
    campaign = app.campaigns[0],
    screen = campaign.screens[0];
  campaign.tools = Object.keys(widgetTypes).map((kind) =>
    newTool(kind as keyof typeof widgetTypes),
  );
  campaign.content = campaign.tools.flatMap((tool) =>
    tool.kind === "note" ? [newNote(tool.name, tool.noteId)] : [],
  );
  screen.widgets = campaign.tools.map((tool, x) => ({
    id: crypto.randomUUID(),
    toolId: tool.id,
    kind: tool.kind,
    x,
    y: 0,
    w: 1,
    h: 1,
    title: "",
  }));
  expect(() => appSchema.parse(app)).not.toThrow();
  expect(
    copyCampaign(campaign).screens[0].widgets.every(
      (w) => w.w === 1 && w.h === 1,
    ),
  ).toBe(true);
  const decoded = await decodeBackup(
    await encodeBackup({ campaign, assets: [], packs: app.packs }),
  );
  expect(decoded.campaign.screens[0].widgets).toEqual(screen.widgets);
  screen.widgets[0].w = 0;
  expect(appSchema.safeParse(app).success).toBe(false);
});

it("adding prefers useful free space and permits a single remaining cell at the chosen origin", () => {
  const screen = newApp().campaigns[0].screens[0];
  expect(fitWidget(screen, { w: 4, h: 5 })).toMatchObject({ w: 4, h: 3, y: 5 });
  expect(fitWidget(screen, { w: 4, h: 5 }, { x: 11, y: 7 })).toEqual({
    x: 11,
    y: 7,
    w: 1,
    h: 1,
  });
  expect(fitWidget(screen, { w: 4, h: 5 }, { x: 0, y: 0 })).toBeNull();
});
