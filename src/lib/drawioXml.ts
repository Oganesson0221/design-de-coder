import type { ArchComponent, ArchConnection } from "@/stores/project";
import { getTechMeta, techLogoUrl } from "./techRegistry";

const KIND_COLOR: Record<string, string> = {
  frontend:  "#dae8fc",
  backend:   "#d5e8d4",
  api:       "#fff2cc",
  database:  "#f8cecc",
  cache:     "#ffe6cc",
  queue:     "#fce4d6",
  ai:        "#e1d5e7",
  auth:      "#f0e6ff",
  storage:   "#fffacd",
  cdn:       "#cce5ff",
};

const KIND_STROKE: Record<string, string> = {
  frontend:  "#6c8ebf",
  backend:   "#82b366",
  api:       "#d6b656",
  database:  "#b85450",
  cache:     "#d79b00",
  queue:     "#b85450",
  ai:        "#9673a6",
  auth:      "#7b5ea7",
  storage:   "#d6b656",
  cdn:       "#6c8ebf",
};

const NODE_W = 180;
const NODE_H = 90;
const LOGO_SIZE = 32;

/**
 * Build draw.io XML.
 *
 * Each component becomes TWO cells:
 *   1. A rounded-rect container (the background card)
 *   2. An image cell (the tech logo) positioned top-centre inside the container
 *
 * The label on the container is placed at the bottom half so it doesn't
 * overlap the logo, using verticalAlign=bottom + spacingBottom.
 */
export function buildDrawioXml(
  components: ArchComponent[],
  connections: ArchConnection[]
): string {
  const cells: string[] = [
    `<mxCell id="0" />`,
    `<mxCell id="1" parent="0" />`,
  ];

  for (const c of components) {
    const meta  = getTechMeta(c.logoKey);
    const fill  = KIND_COLOR[c.kind]   ?? "#f5f5f5";
    const stroke = KIND_STROKE[c.kind] ?? "#666666";
    const logoUrl = techLogoUrl(c.logoKey);

    // ── Container cell (background + labels) ──
    const containerStyle = [
      `rounded=1;`,
      `whiteSpace=wrap;`,
      `html=1;`,
      `fillColor=${fill};`,
      `strokeColor=${stroke};`,
      `strokeWidth=2;`,
      `fontSize=11;`,
      `fontStyle=1;`,           // bold name
      `fontFamily=Helvetica;`,
      `verticalAlign=bottom;`,  // push text to bottom, logo occupies top
      `spacingBottom=8;`,
      `arcSize=10;`,
    ].join("");

    // Label: role name + tech name on second line
    const label = escapeXml(`${c.name}\n${meta.name}`);

    // Set a custom link = "data:component-id,<id>" — draw.io fires
    // { event: "url", url: "data:component-id,<id>" } when the cell is clicked.
    // This is the ONLY reliable click→postMessage mechanism in embed mode.
    const linkAttr = `link="data:component-id,${c.id}"`;

    cells.push(
      `<mxCell id="${c.id}" value="${label}" ${linkAttr} style="${containerStyle}" vertex="1" parent="1">` +
      `<mxGeometry x="${c.x}" y="${c.y}" width="${NODE_W}" height="${NODE_H}" as="geometry" />` +
      `</mxCell>`
    );

    // ── Logo image cell (child of container) ──
    const logoX = (NODE_W - LOGO_SIZE) / 2;   // centred horizontally
    const logoY = 10;                           // near top

    const logoStyle = [
      `shape=image;`,
      `imageStyle=fillColor=none;borderColor=none;`,
      `image=${logoUrl};`,
      `noLabel=1;`,
      `strokeColor=none;`,
      `fillColor=none;`,
      `resizable=0;`,
    ].join("");

    cells.push(
      `<mxCell id="${c.id}__logo" value="" style="${logoStyle}" vertex="1" parent="${c.id}">` +
      `<mxGeometry x="${logoX}" y="${logoY}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" as="geometry" />` +
      `</mxCell>`
    );
  }

  // ── Edges ──
  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i];
    const edgeStyle = [
      `edgeStyle=orthogonalEdgeStyle;`,
      `rounded=1;`,
      `orthogonalLoop=1;`,
      `jettySize=auto;`,
      `exitX=1;exitY=0.5;exitDx=0;exitDy=0;`,
      `entryX=0;entryY=0.5;entryDx=0;entryDy=0;`,
      `strokeColor=#555555;`,
      `strokeWidth=1.5;`,
      `fontSize=9;`,
    ].join("");

    const labelAttr = conn.label
      ? ` value="${escapeXml(conn.label)}"`
      : ` value=""`;

    cells.push(
      `<mxCell id="e${i}"${labelAttr} style="${edgeStyle}" edge="1" source="${conn.from}" target="${conn.to}" parent="1">` +
      `<mxGeometry relative="1" as="geometry" />` +
      `</mxCell>`
    );
  }

  return (
    `<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" ` +
    `tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" ` +
    `pageWidth="1169" pageHeight="827" math="0" shadow="0">` +
    `<root>${cells.join("")}</root>` +
    `</mxGraphModel>`
  );
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
