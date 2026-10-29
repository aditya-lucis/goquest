"use client";

import React from "react";
import { GoCode } from "./go-highlighter";

// ============================================================
// Renderer markdown ringan khusus konten lesson GoQuest.
// Mendukung: ## ### heading, **bold**, `code`, ```go block, - list, > tip
// ============================================================

/** Parse satu baris inline: **bold** dan `code` */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-b${i}`}>{token.slice(2, -2)}</strong>,
      );
    } else {
      parts.push(<code key={`${keyPrefix}-c${i}`}>{token.slice(1, -1)}</code>);
    }
    last = m.index + token.length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function MarkdownLesson({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // code fence
    if (line.trimStart().startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <div key={key++} className="relative rounded-xl border border-border overflow-hidden my-1">
          <div className="dungeon-grid-fine absolute inset-0 pointer-events-none" />
          <div className="relative px-4 py-3 overflow-x-auto">
            <GoCode code={code.join("\n")} />
          </div>
        </div>,
      );
      continue;
    }

    // heading 2/3
    if (line.startsWith("## ")) {
      blocks.push(<h2 key={key++}>{renderInline(line.slice(3), `h2-${key}`)}</h2>);
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={key++}>{renderInline(line.slice(4), `h3-${key}`)}</h3>);
      i++;
      continue;
    }

    // tip / quote
    if (line.startsWith("> ")) {
      const tip: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        tip.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <div
          key={key++}
          className="relative rounded-xl border border-[oklch(0.82_0.16_85/0.4)] bg-[oklch(0.82_0.16_85/0.06)] px-4 py-3 my-4"
        >
          <span className="absolute -top-2.5 left-3 text-[10px] font-bold uppercase tracking-wider bg-[oklch(0.82_0.16_85)] text-[oklch(0.2_0.05_85)] px-2 py-0.5 rounded">
            Tip Guildmaster
          </span>
          <p className="!my-0 !text-[13.5px]">{renderInline(tip.join(" "), `tip-${key}`)}</p>
        </div>,
      );
      continue;
    }

    // list
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("  "))) {
        if (lines[i].startsWith("- ")) items.push(lines[i].slice(2));
        else if (items.length > 0) items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `li-${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // table (sederhana: | a | b |)
    if (line.trimStart().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
        if (!cells.every((c) => /^-{2,}$/.test(c) || c === "---" || c === "")) {
          rows.push(cells);
        } else {
          // separator row — skip
        }
        i++;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={key++} className="overflow-x-auto rounded-xl border border-border my-4">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-secondary/60">
                {head?.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 text-left font-semibold text-cyan-300">
                    {renderInline(h, `th-${key}-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="border-t border-border">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 align-top">
                      {renderInline(c, `td-${key}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // kosong
    if (line.trim() === "") {
      i++;
      continue;
    }

    // paragraf
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{2,3} |```|> |- |\|)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    if (para.length > 0) {
      blocks.push(<p key={key++}>{renderInline(para.join(" "), `p-${key}`)}</p>);
    } else {
      i++;
    }
  }

  return <div className="lesson-content">{blocks}</div>;
}
