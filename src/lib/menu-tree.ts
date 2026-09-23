import menuXml from "../data/menu.xml?raw";

export type MenuNode = {
  id: string;
  text: string;
  children: MenuNode[];
};

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

/**
 * Minimal parser for the <node text="..."> tree structure.
 * Works identically on the server (SSR) and in the browser.
 */
export function parseMenuXml(xml: string): MenuNode[] {
  const roots: MenuNode[] = [];
  const stack: MenuNode[] = [];
  let counter = 0;

  const tagRe = /<\s*node\b([^>]*?)(\/?)>|<\s*\/\s*node\s*>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(xml)) !== null) {
    const [full, attrs, selfClosing] = match;

    if (full.startsWith("</")) {
      stack.pop();
      continue;
    }

    const textMatch = /text\s*=\s*"([^"]*)"/.exec(attrs ?? "");
    const node: MenuNode = {
      id: `n${counter++}`,
      text: decodeEntities(textMatch ? textMatch[1] : ""),
      children: [],
    };

    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(node);
    else roots.push(node);

    if (!selfClosing) stack.push(node);
  }

  return roots;
}

export const menuTree: MenuNode[] = parseMenuXml(menuXml);

export function collectIdsWithChildren(nodes: MenuNode[], acc: string[] = []): string[] {
  for (const node of nodes) {
    if (node.children.length > 0) {
      acc.push(node.id);
      collectIdsWithChildren(node.children, acc);
    }
  }
  return acc;
}

/** Returns a filtered tree keeping matches and their ancestors. */
export function filterTree(nodes: MenuNode[], query: string): MenuNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const walk = (list: MenuNode[]): MenuNode[] => {
    const result: MenuNode[] = [];
    for (const node of list) {
      const children = walk(node.children);
      const selfMatch = node.text.toLowerCase().includes(q);
      if (selfMatch || children.length > 0) {
        result.push({ ...node, children: selfMatch ? node.children : children });
      }
    }
    return result;
  };

  return walk(nodes);
}
