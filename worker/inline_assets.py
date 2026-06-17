#!/usr/bin/env python3
"""Embed all PWA assets into the worker JS as a single file."""
import base64, json, os, mimetypes

def read_file(path):
    with open(path, "r") as f:
        return f.read()

assets_dir = os.path.join(os.path.dirname(__file__), "assets")
assets = {}

for filename in os.listdir(assets_dir):
    filepath = os.path.join(assets_dir, filename)
    if os.path.isfile(filepath):
        content = read_file(filepath)
        assets[filename] = content

# Generate the inline asset serving code
# For JS, we need to escape backticks and ${} in template literals
js_code = """
const ASSETS = {};
"""

for name, content in assets.items():
    # Determine content type
    ct, _ = mimetypes.guess_type(name)
    if ct is None:
        if name.endswith('.js'):
            ct = 'application/javascript'
        elif name.endswith('.css'):
            ct = 'text/css'
        elif name.endswith('.html'):
            ct = 'text/html'
        elif name.endswith('.json'):
            ct = 'application/json'
        else:
            ct = 'text/plain'
    
    # Escape backticks for JS template literal
    escaped = content.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    js_code += f"""
ASSETS["{name}"] = {{
  contentType: "{ct}",
  content: `{escaped}`,
}};
"""

js_code += """
async function serveAsset(path) {
  let filename = path.replace(/^\\//, "").replace(/^assets\\//, "");
  if (!filename) filename = "index.html";
  const asset = ASSETS[filename];
  if (!asset) return null;
  const isHtml = asset.contentType === "text/html";
  return new Response(asset.content, {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": isHtml ? "no-cache" : "public, max-age=3600",
    },
  });
}

// Export for the worker to use
export { serveAsset };
"""

with open("assets-inline.js", "w") as f:
    f.write(js_code)

print(f"Generated assets-inline.js with {len(assets)} assets:")
for name in sorted(assets.keys()):
    size = len(assets[name])
    print(f"  {name}: {size} bytes")

print(f"\nTotal asset size: {sum(len(c) for c in assets.values())} bytes")
