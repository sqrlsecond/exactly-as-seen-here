import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  collectIdsWithChildren,
  filterTree,
  menuTree,
  type MenuNode,
} from "@/lib/menu-tree";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Меню устройства — интерактивное дерево" },
      {
        name: "description",
        content:
          "Интерактивное древовидное меню устройства с поиском, раскрытием и сворачиванием пунктов.",
      },
      { property: "og:title", content: "Меню устройства — интерактивное дерево" },
      {
        property: "og:description",
        content:
          "Интерактивное древовидное меню устройства с поиском, раскрытием и сворачиванием пунктов.",
      },
    ],
  }),
  component: Index,
});

function TreeNode({
  node,
  depth,
  expanded,
  toggle,
}: {
  node: MenuNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const label = node.text.trim() === "" ? "—" : node.text;

  return (
    <li>
      {hasChildren ? (
        <button
          type="button"
          onClick={() => toggle(node.id)}
          aria-expanded={isOpen}
          className="flex w-full items-start gap-2 rounded px-1 py-1 text-left text-sm text-foreground hover:bg-muted"
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          <span className="w-3 shrink-0 text-muted-foreground">{isOpen ? "▼" : "▶"}</span>
          <span className="whitespace-pre-wrap">{label}</span>
        </button>
      ) : (
        <div
          className="flex items-start gap-2 px-1 py-1 text-sm text-foreground"
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          <span className="w-3 shrink-0" />
          <span className="whitespace-pre-wrap">{label}</span>
        </div>
      )}

      {hasChildren && isOpen && (
        <ul>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function Index() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const tree = useMemo(() => filterTree(menuTree, query), [query]);

  const searching = query.trim().length > 0;
  const searchExpanded = useMemo(
    () => (searching ? new Set(collectIdsWithChildren(tree)) : expanded),
    [searching, tree, expanded],
  );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по меню"
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setExpanded(new Set(collectIdsWithChildren(menuTree)))}
            className="rounded border border-input px-2 py-1 text-xs text-foreground hover:bg-muted"
          >
            Раскрыть всё
          </button>
          <button
            type="button"
            onClick={() => setExpanded(new Set())}
            className="rounded border border-input px-2 py-1 text-xs text-foreground hover:bg-muted"
          >
            Свернуть всё
          </button>
        </div>

        {tree.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Ничего не найдено</p>
        ) : (
          <ul className="mt-4">
            {tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                expanded={searchExpanded}
                toggle={toggle}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
