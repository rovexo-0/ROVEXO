function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function renderMarkdown(content: string): string {
  const lines = content.trim().split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h3 class="mt-ds-4 text-base font-semibold text-text-primary">${inlineMarkdown(line.slice(3))}</h3>`);
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h2 class="mt-ds-5 text-lg font-semibold text-text-primary">${inlineMarkdown(line.slice(2))}</h2>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html.push('<ul class="mt-ds-2 list-disc space-y-ds-1 pl-ds-5 text-sm text-text-secondary">');
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p class="mt-ds-2 text-sm leading-relaxed text-text-secondary">${inlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join("");
}
