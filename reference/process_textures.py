import os
import sys
from collections import deque
from PIL import Image, ImageFilter

def make_transparent_from_borders(img_path, out_path, tolerance=26, feather_radius=1.2):
    img = Image.open(img_path).convert('RGB')
    w, h = img.size
    pixels = img.load()

    # Determine background color from corners
    corners = [
        pixels[0, 0], pixels[w - 1, 0], pixels[0, h - 1], pixels[w - 1, h - 1],
        pixels[w // 2, 0], pixels[0, h // 2], pixels[w - 1, h // 2], pixels[w // 2, h - 1]
    ]
    bg_r = sum(c[0] for c in corners) / len(corners)
    bg_g = sum(c[1] for c in corners) / len(corners)
    bg_b = sum(c[2] for c in corners) / len(corners)

    # Flood-fill mask from edges
    # mask: 255 = foreground (opaque), 0 = background (transparent)
    mask = Image.new('L', (w, h), 255)
    mask_pixels = mask.load()

    visited = bytearray(w * h)
    queue = deque()

    def is_bg(x, y):
        r, g, b = pixels[x, y]
        dr = abs(r - bg_r)
        dg = abs(g - bg_g)
        db = abs(b - bg_b)
        dist = (dr*dr + dg*dg + db*db) ** 0.5
        min_c = min(r, g, b)
        max_c = max(r, g, b)
        # Background is near white/light grey (high brightness and low saturation)
        return (dist < tolerance) or (min_c >= 232 and (max_c - min_c) < 18) or (r >= 246 and g >= 246 and b >= 246)

    # Enqueue perimeter
    for x in range(w):
        for y in (0, h - 1):
            idx = y * w + x
            if not visited[idx] and is_bg(x, y):
                visited[idx] = 1
                mask_pixels[x, y] = 0
                queue.append((x, y))

    for y in range(h):
        for x in (0, w - 1):
            idx = y * w + x
            if not visited[idx] and is_bg(x, y):
                visited[idx] = 1
                mask_pixels[x, y] = 0
                queue.append((x, y))

    # BFS flood fill
    while queue:
        cx, cy = queue.popleft()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                nidx = ny * w + nx
                if not visited[nidx]:
                    visited[nidx] = 1
                    if is_bg(nx, ny):
                        mask_pixels[nx, ny] = 0
                        queue.append((nx, ny))

    # Smooth the mask boundary to avoid hard pixels
    if feather_radius > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(feather_radius))

    # Apply alpha mask to image
    rgba = img.convert('RGBA')
    rgba.putalpha(mask)

    # Save PNG
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    rgba.save(out_path, format='PNG', optimize=True)
    print(f"Saved: {out_path} ({w}x{h})")

if __name__ == '__main__':
    if len(sys.argv) >= 3:
        src = sys.argv[1]
        dst = sys.argv[2]
        tol = float(sys.argv[3]) if len(sys.argv) > 3 else 26
        make_transparent_from_borders(src, dst, tolerance=tol)
    else:
        print("Usage: python3 process_textures.py <src_jpg> <dst_png> [tolerance]")

