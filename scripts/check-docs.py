"""Verifica links relativos e âncoras nos Markdown do repositório.

Uso: python scripts/check-docs.py  (código 0 = ok, 1 = problemas encontrados)
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "node_modules", "android", "ios", ".expo", "dist"}
LINK = re.compile(r"\]\(([^)\s#]*)(#[^)\s]+)?\)")
HEADING = re.compile(r"^#{1,6} (.+?)\s*$", re.M)
FENCE = re.compile(r"^```.*?^```", re.M | re.S)


def slug(text: str) -> str:
    """Âncora no formato do GitHub: minúsculas, sem pontuação, espaços viram hífens."""
    text = re.sub(r"[^\w\- ]", "", text.strip().lower())
    return text.replace(" ", "-")


def anchors(path: str) -> set:
    body = FENCE.sub("", open(path, encoding="utf-8").read())
    seen, result = {}, set()
    for h in HEADING.findall(body):
        s = slug(h)
        n = seen.get(s, 0)
        result.add(s if n == 0 else f"{s}-{n}")
        seen[s] = n + 1
    return result


def markdown_files():
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith(".md"):
                yield os.path.join(base, f)


def main() -> int:
    problems = []
    cache = {}
    for md in markdown_files():
        text = FENCE.sub("", open(md, encoding="utf-8").read())
        for m in LINK.finditer(text):
            target, anchor = m.group(1), m.group(2)
            if re.match(r"^[a-z]+:", target):  # http:, https:, mailto:
                continue
            path = os.path.normpath(os.path.join(os.path.dirname(md), target)) if target else md
            rel = os.path.relpath(md, ROOT)
            if not os.path.exists(path):
                problems.append(f"{rel}: link quebrado -> {target}")
                continue
            if anchor and path.endswith(".md"):
                if path not in cache:
                    cache[path] = anchors(path)
                if anchor[1:] not in cache[path]:
                    problems.append(f"{rel}: âncora inexistente -> {target}{anchor}")
    for p in problems:
        print(p)
    print(f"{len(problems)} problema(s) em links/âncoras")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
