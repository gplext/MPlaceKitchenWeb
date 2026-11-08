"""Original flat food illustrations for the Living Foods demo catalogue. Writes one SVG per product."""
import math
import os
import random
import sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
W, H = 800, 960

BG = {
    "teal": ("#0e9aa7", "#3fbcc6"),
    "magenta": ("#c8235f", "#e0517f"),
    "orange": ("#eb5919", "#f5844f"),
    "green": ("#2a6040", "#3f7d57"),
    "royal": ("#1d4fb0", "#4572cc"),
    "gold": ("#d9962b", "#ecb551"),
    "cream": ("#e9dcc6", "#f7efe1"),
}


def jaali(color):
    return f"""<pattern id="j" width="64" height="64" patternUnits="userSpaceOnUse">
<path d="M32 4l8 20 20 8-20 8-8 20-8-20-20-8 20-8z" fill="none" stroke="{color}" stroke-opacity=".22" stroke-width="2"/>
<circle cx="32" cy="32" r="6" fill="none" stroke="{color}" stroke-opacity=".22" stroke-width="2"/></pattern>"""


def frame(bg, body, label_color="#fff"):
    base, light = BG[bg]
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>{jaali('#ffffff')}
<radialGradient id="halo" cx="50%" cy="56%" r="55%"><stop offset="0" stop-color="{light}"/><stop offset="1" stop-color="{base}"/></radialGradient>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<rect width="{W}" height="{H}" fill="url(#halo)"/>
<rect width="{W}" height="{H}" fill="url(#j)"/>
{body}
</svg>"""


def shadow(cx, cy, rx, ry, op=0.28):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#000" opacity="{op}" filter="url(#soft)"/>'


def plate(cx, cy, rx, ry, rim="#fffaf1", inner="#f1e6d3", border="#c9b79a"):
    return (shadow(cx, cy + 22, rx * 0.95, ry * 0.75)
            + f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{rim}" stroke="{border}" stroke-width="4"/>'
            + f'<ellipse cx="{cx}" cy="{cy}" rx="{rx*0.78}" ry="{ry*0.74}" fill="{inner}"/>'
            + truck_rim(cx, cy, rx, ry))


def truck_rim(cx, cy, rx, ry):
    """Small painted flowers around a plate rim, a nod to truck art."""
    out = []
    for i in range(10):
        a = i / 10 * 2 * math.pi
        x, y = cx + rx * 0.89 * math.cos(a), cy + ry * 0.87 * math.sin(a)
        col = ["#c8235f", "#0e9aa7", "#eb5919", "#1d4fb0", "#8ec93c"][i % 5]
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7" fill="{col}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="2.6" fill="#e9b44c"/>')
    return "".join(out)


def bowl(cx, cy, w, h, color="#fffaf1", band="#1d4fb0", fill=None, fill_h=0.0):
    """Side-view bowl: an ellipse opening on a half-round body."""
    rx = w / 2
    out = shadow(cx, cy + h + 10, rx * 0.8, 26)
    out += f'<path d="M{cx-rx} {cy} A{rx} {h} 0 0 0 {cx+rx} {cy} Z" fill="{color}" stroke="#c9b79a" stroke-width="4"/>'
    out += f'<path d="M{cx-rx*0.93} {cy+h*0.28} A{rx*0.93} {h*0.7} 0 0 0 {cx+rx*0.93} {cy+h*0.28}" fill="none" stroke="{band}" stroke-width="12"/>'
    for i in range(7):
        x = cx - rx * 0.6 + i * rx * 0.2
        out += f'<circle cx="{x:.1f}" cy="{cy+h*0.47:.1f}" r="6" fill="#eb5919"/>'
    out += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{h*0.24}" fill="{fill or color}" stroke="#c9b79a" stroke-width="4"/>'
    return out


def grains(cx, cy, rx, ry, n, colors, seed, size=(9, 3.4)):
    rnd = random.Random(seed)
    out = []
    for _ in range(n):
        t, r = rnd.random() * 2 * math.pi, math.sqrt(rnd.random())
        x, y = cx + rx * r * math.cos(t), cy + ry * r * math.sin(t)
        out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{size[0]}" ry="{size[1]}" fill="{rnd.choice(colors)}" transform="rotate({rnd.randint(0,180)} {x:.1f} {y:.1f})"/>')
    return "".join(out)


def dots(cx, cy, rx, ry, n, colors, seed, r=(4, 8)):
    rnd = random.Random(seed)
    out = []
    for _ in range(n):
        t, d = rnd.random() * 2 * math.pi, math.sqrt(rnd.random())
        x, y = cx + rx * d * math.cos(t), cy + ry * d * math.sin(t)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(*r):.1f}" fill="{rnd.choice(colors)}"/>')
    return "".join(out)


def chunk(x, y, s, color="#a5531f", hi="#c97a3b", rot=0):
    return (f'<g transform="rotate({rot} {x} {y})"><path d="M{x-s} {y} q{s*0.2} {-s*0.9} {s} {-s*0.8} q{s*0.9} {0.1*s} {s} {s*0.7} q{-s*0.2} {s*0.7} {-s} {s*0.7} q{-s*0.9} 0 {-s} {-s*0.6}z" fill="{color}"/>'
            f'<path d="M{x-s*0.5} {y-s*0.35} q{s*0.5} {-s*0.4} {s} 0" stroke="{hi}" stroke-width="5" fill="none" stroke-linecap="round"/></g>')


def chili(x, y, rot=0):
    return f'<g transform="rotate({rot} {x} {y})"><path d="M{x} {y} q40 -8 70 10 q-36 4 -70 -2z" fill="#3c9a2e"/><path d="M{x} {y} l-10 -6" stroke="#2d6b20" stroke-width="5" stroke-linecap="round"/></g>'


def label(text, y=860, color="#fffaf1"):
    return (f'<rect x="200" y="{y-44}" width="400" height="64" rx="8" fill="#1a1a1a" opacity=".18"/>'
            f'<text x="400" y="{y}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="40" fill="{color}">{text}</text>')


# ---------------------------------------------------------------- dishes

def biryani():
    b = plate(400, 560, 300, 150)
    b += f'<ellipse cx="400" cy="520" rx="215" ry="115" fill="#f3d48a"/>'
    b += grains(400, 515, 210, 110, 520, ["#fbf3e1", "#f6d77e", "#ee9a3a", "#fff8ea", "#f9e2a8"], 1)
    for x, y, r in [(330, 500, 10), (450, 470, 30), (380, 560, -20), (480, 545, 15), (300, 560, 40)]:
        b += chunk(x, y, 34, rot=r)
    b += dots(400, 510, 190, 95, 40, ["#3c9a2e", "#4fb33a"], 2, (4, 7))
    b += dots(400, 510, 190, 95, 30, ["#7a3b12", "#5a2a0c"], 3, (3, 5))
    b += f'<ellipse cx="520" cy="480" rx="26" ry="14" fill="#f4e5b8"/><ellipse cx="520" cy="480" rx="11" ry="9" fill="#f2a900"/>'
    return frame("orange", b)


def bun_kebab():
    cx = 400
    b = shadow(cx, 700, 230, 40)
    b += f'<path d="M190 640 q210 60 420 0 l-10 30 q-200 50 -400 0z" fill="#d9893c"/>'
    b += f'<path d="M200 600 q200 40 400 0 l0 30 q-200 40 -400 0z" fill="#4fae3a"/>'
    b += f'<path d="M210 570 q190 30 380 0 l10 35 q-200 40 -400 0z" fill="#8a3d18"/>'
    b += grains(400, 580, 180, 18, 60, ["#6d2c10", "#a9542a"], 4, (6, 3))
    b += f'<path d="M205 548 q195 34 390 0 l5 22 q-200 40 -400 0z" fill="#f6c84a"/>'
    b += f'<path d="M215 530 l370 0 l-30 22 l-30 -10 l-30 14 l-30 -12 l-30 14 l-30 -10 l-30 14 l-30 -12 l-30 14 l-30 -10 l-30 12z" fill="#2f9e5b"/>'
    b += f'<path d="M200 540 q20 -200 200 -210 q180 10 200 210 z" fill="#e2a24a"/>'
    b += f'<path d="M250 420 q60 -70 140 -76" stroke="#f3c77e" stroke-width="14" fill="none" stroke-linecap="round"/>'
    b += dots(400, 440, 150, 70, 26, ["#fbf0d4"], 5, (4, 5))
    b += f'<circle cx="560" cy="650" r="34" fill="#f2eee4"/><circle cx="560" cy="650" r="26" fill="#d94a3a"/>'
    return frame("magenta", b)


def chicken_burger():
    b = shadow(400, 730, 240, 40)
    b += f'<path d="M180 660 q220 70 440 0 l-14 44 q-206 52 -412 0z" fill="#d48b3e"/>'
    b += f'<path d="M170 620 q230 50 460 0 l0 40 q-230 50 -460 0z" fill="#b8621d"/>'
    b += grains(400, 640, 210, 18, 90, ["#e9a14d", "#8f4512", "#f0b968"], 6, (8, 4))
    b += f'<path d="M200 600 l400 0 l-40 70 l-60 -40 l-50 60 l-50 -60 l-50 60 l-50 -60 l-60 40z" fill="#f4c22a"/>'
    b += f'<path d="M180 585 q40 -30 80 0 q40 -30 80 0 q40 -30 80 0 q40 -30 80 0 q40 -30 80 0 l0 30 l-400 0z" fill="#58b442"/>'
    b += f'<ellipse cx="320" cy="572" rx="44" ry="12" fill="#d8352a"/><ellipse cx="470" cy="572" rx="44" ry="12" fill="#d8352a"/>'
    b += f'<path d="M180 570 q30 -180 220 -186 q190 6 220 186 z" fill="#e5a24b"/>'
    b += f'<path d="M250 460 q70 -60 150 -64" stroke="#f3c77e" stroke-width="16" fill="none" stroke-linecap="round"/>'
    b += grains(400, 470, 160, 50, 30, ["#fff6df"], 7, (8, 4))
    return frame("royal", b)


def chicken_karahi():
    b = shadow(400, 700, 280, 50)
    b += f'<path d="M120 500 q280 330 560 0 z" fill="#2b2b2b"/>'
    b += f'<path d="M100 490 q-40 -10 -50 20 q40 10 70 0z" fill="#2b2b2b"/><path d="M700 490 q40 -10 50 20 q-40 10 -70 0z" fill="#2b2b2b"/>'
    b += f'<ellipse cx="400" cy="500" rx="280" ry="70" fill="#3a3a3a"/>'
    b += f'<ellipse cx="400" cy="505" rx="250" ry="58" fill="#b8341c"/>'
    b += dots(400, 505, 230, 50, 60, ["#d9542c", "#9e2a14", "#e37a3a"], 8, (6, 14))
    for x, y, r in [(310, 495, 10), (430, 480, -15), (510, 515, 25), (360, 525, 40)]:
        b += chunk(x, y, 32, color="#c0622a", hi="#e08a4a", rot=r)
    b += chili(250, 480, -10) + chili(470, 520, 20)
    b += grains(400, 495, 220, 40, 30, ["#f4d97a"], 9, (12, 2.5))
    b += dots(400, 500, 220, 45, 26, ["#3c9a2e"], 10, (3, 6))
    return frame("green", b)


def daal_chawal():
    b = plate(400, 580, 300, 150)
    b += f'<ellipse cx="320" cy="560" rx="150" ry="80" fill="#fbf3e1"/>'
    b += grains(320, 556, 145, 74, 280, ["#fffaf0", "#f6ead2", "#fff"], 11)
    b += f'<ellipse cx="500" cy="545" rx="125" ry="60" fill="#fffaf1" stroke="#c9b79a" stroke-width="4"/>'
    b += f'<ellipse cx="500" cy="540" rx="105" ry="46" fill="#e7a51f"/>'
    b += dots(500, 538, 95, 38, 40, ["#f2bf3e", "#c9851a", "#d9962b"], 12, (4, 9))
    b += dots(500, 535, 80, 30, 14, ["#3c9a2e"], 13, (3, 5)) + dots(500, 535, 80, 30, 10, ["#b8341c"], 14, (3, 5))
    b += chili(230, 620, 15)
    return frame("teal", b)


def shawarma():
    b = shadow(400, 720, 220, 40)
    b += f'<g transform="rotate(-24 400 520)">'
    b += f'<rect x="300" y="260" width="200" height="420" rx="90" fill="#f0d29a"/>'
    b += f'<path d="M300 300 q100 -60 200 0 l0 40 q-100 -40 -200 0z" fill="#e8bd73"/>'
    b += grains(400, 300, 90, 30, 30, ["#a9542a", "#3c9a2e", "#d8352a", "#fffaf0"], 15, (12, 5))
    b += f'<path d="M290 470 l220 0 l0 230 q-110 40 -220 0z" fill="#fffaf1" stroke="#c9b79a" stroke-width="4"/>'
    b += f'<path d="M290 520 l220 0" stroke="#c8235f" stroke-width="14"/><path d="M290 548 l220 0" stroke="#0e9aa7" stroke-width="8"/>'
    b += f'<text x="400" y="630" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="34" fill="#1f4d36">LF</text>'
    b += '</g>'
    return frame("gold", b)


def banana_cake():
    b = shadow(400, 690, 260, 40)
    b += f'<path d="M160 470 l480 0 l-30 220 l-420 0z" fill="#a8622b"/>'
    b += f'<path d="M160 470 q240 -120 480 0 z" fill="#c9843e"/>'
    b += f'<path d="M190 480 l420 0" stroke="#8a4c1d" stroke-width="6" stroke-dasharray="20 14"/>'
    for i, x in enumerate([260, 340, 420, 500]):
        y = 440 - (12 if i in (1, 2) else 0)
        b += f'<ellipse cx="{x}" cy="{y}" rx="38" ry="22" fill="#f7e7a6" stroke="#d9b75e" stroke-width="3"/><circle cx="{x}" cy="{y}" r="5" fill="#d9b75e"/>'
    b += dots(400, 590, 200, 80, 40, ["#7a3f15", "#5a2a0c"], 16, (3, 6))
    b += f'<path d="M540 520 l80 -20 l-20 170 l-80 0z" fill="#f2d9a3" opacity=".9"/>'
    return frame("teal", b)


def chocolate_brownie():
    b = shadow(400, 700, 250, 40)
    for (x, y) in [(240, 520), (420, 520), (330, 400)]:
        b += f'<path d="M{x-70} {y} l140 0 l0 110 l-140 0z" fill="#4a2512"/>'
        b += f'<path d="M{x-70} {y} l40 -36 l140 0 l-40 36z" fill="#6b3a1d"/>'
        b += f'<path d="M{x+70} {y} l40 -36 l0 110 l-40 36z" fill="#3a1c0c"/>'
        b += grains(x - 10, y - 18, 70, 12, 14, ["#8a5530", "#2f160a"], int(x + y), (10, 3))
        b += dots(x, y + 55, 55, 40, 8, ["#2a1206", "#6b3a1d"], int(x * y), (4, 7))
    b += f'<path d="M180 690 q220 -30 440 0" stroke="#fffaf1" stroke-width="10" fill="none"/>'
    return frame("magenta", b)


def kheer():
    b = bowl(400, 520, 420, 220, fill="#f8efd8", band="#c8235f")
    b += grains(400, 518, 190, 40, 120, ["#fffaf0", "#f3e3bd"], 17, (8, 3))
    b += grains(400, 515, 150, 30, 26, ["#8ec93c", "#5aa02c"], 18, (8, 4))
    b += grains(400, 515, 150, 30, 20, ["#e8c9a0", "#d9b080"], 19, (11, 4))
    b += f'<path d="M560 420 q30 -60 70 -40 q-20 50 -70 40z" fill="#4fae3a"/>'
    return frame("royal", b)


def gulab_jamun():
    b = bowl(400, 530, 440, 220, fill="#d9962b", band="#0e9aa7")
    for x, y in [(310, 515), (400, 500), (490, 515), (355, 535), (445, 535)]:
        b += f'<circle cx="{x}" cy="{y-20}" r="48" fill="#6b2c0f"/><circle cx="{x-16}" cy="{y-38}" r="12" fill="#a2521f" opacity=".8"/>'
    b += grains(400, 470, 140, 40, 14, ["#8ec93c"], 20, (7, 3))
    return frame("cream", b)


def gajar_halwa():
    b = bowl(400, 520, 420, 220, fill="#e8661f", band="#1d4fb0")
    b += grains(400, 512, 190, 38, 260, ["#f07a2a", "#d9541a", "#f6923f", "#c9461a"], 21, (10, 2.5))
    b += grains(400, 505, 130, 26, 22, ["#e8c9a0"], 22, (11, 4)) + grains(400, 505, 130, 26, 18, ["#8ec93c"], 23, (7, 3))
    b += f'<path d="M180 640 q60 -40 120 -10" stroke="#3c9a2e" stroke-width="12" fill="none" stroke-linecap="round"/>'
    return frame("teal", b)


# ---------------------------------------------------------------- dairy

def milk_bottle():
    b = shadow(400, 760, 170, 34)
    b += f'<path d="M330 230 l140 0 l0 70 q80 60 80 160 l0 270 q0 30 -30 30 l-240 0 q-30 0 -30 -30 l0 -270 q0 -100 80 -160z" fill="#ffffff" stroke="#c9d6dc" stroke-width="6"/>'
    b += f'<rect x="320" y="200" width="160" height="50" rx="10" fill="#2a6040"/>'
    b += f'<path d="M260 470 l280 0 l0 200 l-280 0z" fill="#fbf3e6"/><path d="M260 470 l280 0" stroke="#eb5919" stroke-width="12"/><path d="M260 670 l280 0" stroke="#eb5919" stroke-width="12"/>'
    b += f'<text x="400" y="560" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="46" fill="#1f4d36">Fresh</text>'
    b += f'<text x="400" y="618" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="46" fill="#1f4d36">Milk</text>'
    b += f'<path d="M300 330 q-20 60 -20 150" stroke="#e6eef1" stroke-width="16" fill="none" stroke-linecap="round"/>'
    return frame("teal", b)


def dahi():
    b = shadow(400, 740, 220, 40)
    b += f'<path d="M190 430 q0 290 210 300 q210 -10 210 -300z" fill="#b8562a"/>'
    b += f'<path d="M210 500 q190 40 380 0" stroke="#e9b44c" stroke-width="12" fill="none"/>'
    for i in range(6):
        x = 240 + i * 64
        b += f'<path d="M{x} 560 l20 -26 l20 26 l-20 26z" fill="#fbf3e6"/>'
    b += f'<ellipse cx="400" cy="430" rx="210" ry="58" fill="#8e3d18"/><ellipse cx="400" cy="432" rx="186" ry="46" fill="#fbf8f1"/>'
    b += f'<path d="M290 430 q110 -30 220 0" stroke="#efe7d6" stroke-width="10" fill="none"/>'
    return frame("magenta", b)


def lassi():
    b = shadow(400, 760, 150, 30)
    b += f'<path d="M280 300 l240 0 l-30 440 l-180 0z" fill="#fff7e8" stroke="#d9cbb0" stroke-width="5" opacity=".95"/>'
    b += f'<path d="M290 360 l220 0 l-25 375 l-170 0z" fill="#fbecc8"/>'
    b += f'<path d="M280 300 q40 -50 80 -10 q40 -50 80 0 q40 -50 80 10 l0 30 l-240 0z" fill="#fffdf6" stroke="#e8dcc3" stroke-width="4"/>'
    b += f'<path d="M440 120 l40 0 l-50 480 l-24 0z" fill="#c8235f"/><path d="M450 200 l20 0" stroke="#fff" stroke-width="8"/><path d="M445 260 l20 0" stroke="#fff" stroke-width="8"/>'
    b += dots(400, 290, 70, 12, 10, ["#8ec93c", "#e9b44c"], 24, (4, 7))
    b += f'<path d="M310 420 l12 230" stroke="#fffdf6" stroke-width="12" stroke-linecap="round" opacity=".8"/>'
    return frame("orange", b)


def makhan():
    b = plate(400, 600, 290, 140, inner="#e9f2dd")
    b += f'<path d="M260 560 q140 -110 280 0 q-140 70 -280 0z" fill="#4f9e3a"/>'
    b += f'<path d="M270 520 l230 0 l40 50 l-230 0z" fill="#f8de6c"/><path d="M270 520 l0 80 l230 0 l0 -80z" fill="#f2c94c"/><path d="M500 520 l40 50 l0 80 l-40 -50z" fill="#e2b334"/>'
    b += f'<path d="M270 520 l230 0 l40 50 l-230 0z" fill="#fbe58a"/>'
    b += f'<path d="M330 540 q40 -20 80 0" stroke="#fff3b8" stroke-width="10" fill="none" stroke-linecap="round"/>'
    b += f'<path d="M520 470 l90 -70" stroke="#a87b4a" stroke-width="14" stroke-linecap="round"/><path d="M500 488 l30 -24 l18 20 l-30 24z" fill="#cfd5d8"/>'
    return frame("gold", b)


def paneer():
    b = plate(400, 590, 300, 145)
    rnd = random.Random(25)
    for (x, y) in [(300, 540), (400, 520), (500, 545), (350, 600), (455, 605), (255, 595), (545, 610)]:
        s = 52
        b += f'<path d="M{x} {y} l{s} 0 l{s*0.4} {-s*0.35} l{-s} 0z" fill="#ffffff"/>'
        b += f'<path d="M{x} {y} l{s} 0 l0 {s*0.8} l{-s} 0z" fill="#f4efe3"/>'
        b += f'<path d="M{x+s} {y} l{s*0.4} {-s*0.35} l0 {s*0.8} l{-s*0.4} {s*0.35}z" fill="#e3dccb"/>'
    b += dots(400, 560, 220, 70, 16, ["#3c9a2e"], 26, (3, 6))
    return frame("green", b)


def ghee():
    b = shadow(400, 760, 190, 34)
    b += f'<rect x="230" y="330" width="340" height="420" rx="40" fill="#f6c440" opacity=".95"/>'
    b += f'<rect x="230" y="330" width="340" height="420" rx="40" fill="none" stroke="#e1d6bf" stroke-width="8"/>'
    b += f'<rect x="215" y="270" width="370" height="80" rx="14" fill="#c8235f"/>'
    b += ''.join(f'<rect x="{230+i*26}" y="282" width="12" height="56" rx="6" fill="#e0517f"/>' for i in range(14))
    b += f'<path d="M250 480 l300 0 l0 170 l-300 0z" fill="#fbf3e6"/><path d="M250 480 l300 0" stroke="#2a6040" stroke-width="12"/><path d="M250 650 l300 0" stroke="#2a6040" stroke-width="12"/>'
    b += f'<text x="400" y="560" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="44" fill="#1f4d36">Desi</text>'
    b += f'<text x="400" y="615" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="44" fill="#1f4d36">Ghee</text>'
    b += f'<path d="M270 380 l0 70" stroke="#fde69a" stroke-width="16" stroke-linecap="round"/>'
    return frame("royal", b)


# ---------------------------------------------------------------- frozen

def frozen_box(title, items_svg, bg, accent="#0e9aa7"):
    b = shadow(400, 780, 260, 40)
    b += f'<path d="M150 300 l500 0 l0 460 l-500 0z" fill="#fbf3e6"/>'
    b += f'<path d="M150 300 l500 0 l-40 -60 l-420 0z" fill="#efe2c8"/>'
    b += f'<path d="M150 300 l500 0 l0 70 l-500 0z" fill="{accent}"/>'
    b += f'<text x="400" y="350" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="40" fill="#fff">{title}</text>'
    b += f'<rect x="190" y="400" width="420" height="270" rx="26" fill="#dff1f4" stroke="#b8d8de" stroke-width="5"/>'
    b += items_svg
    b += f'<path d="M150 700 l500 0" stroke="#eb5919" stroke-width="12"/>'
    b += f'<text x="400" y="745" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="28" fill="#1f4d36">Living Foods · Frozen fresh</text>'
    b += snowflake(590, 250, 50)
    return frame(bg, b)


def snowflake(x, y, r):
    out = f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff"/>'
    for a in range(0, 180, 30):
        out += f'<path d="M{x} {y-r*0.7} l0 {r*1.4}" stroke="#0e9aa7" stroke-width="6" stroke-linecap="round" transform="rotate({a} {x} {y})"/>'
    return out


def seekh_kebab():
    items = ''.join(f'<rect x="230" y="{430+i*46}" width="340" height="34" rx="17" fill="#8a3d18"/><path d="M250 {440+i*46} l300 0" stroke="#a9542a" stroke-width="5" stroke-dasharray="14 10"/>' for i in range(5))
    items += ''.join(f'<path d="M570 {447+i*46} l30 0" stroke="#bfc5c8" stroke-width="6"/>' for i in range(5))
    return frozen_box("SEEKH KEBAB", items, "royal")


def nuggets():
    rnd = random.Random(27)
    items = ""
    for i in range(12):
        x, y = 250 + (i % 4) * 100 + rnd.randint(-8, 8), 470 + (i // 4) * 70 + rnd.randint(-6, 6)
        items += f'<path d="M{x-36} {y} q4 -26 34 -24 q34 -4 38 22 q-4 26 -36 26 q-32 2 -36 -24z" fill="#e3a142"/>'
        items += dots(x, y, 30, 16, 8, ["#c8802a", "#f2c26a"], i + 100, (2, 3.5))
    return frozen_box("CHICKEN NUGGETS", items, "orange", "#c8235f")


def samosa():
    items = ""
    for i in range(6):
        x, y = 270 + (i % 3) * 130, 500 + (i // 3) * 100
        items += f'<path d="M{x} {y-50} l60 90 l-120 0z" fill="#e9b25a" stroke="#c98a32" stroke-width="5" stroke-linejoin="round"/>'
        items += f'<path d="M{x-30} {y+20} q30 -10 60 0" stroke="#c98a32" stroke-width="4" fill="none"/>'
    return frozen_box("ALOO SAMOSA", items, "green", "#eb5919")


def shami():
    items = ""
    for i in range(8):
        x, y = 260 + (i % 4) * 95, 480 + (i // 4) * 105
        items += f'<ellipse cx="{x}" cy="{y}" rx="42" ry="36" fill="#7a3a17"/><ellipse cx="{x-8}" cy="{y-8}" rx="22" ry="16" fill="#9c5326"/>'
    return frozen_box("SHAMI KEBAB", items, "magenta", "#1d4fb0")


def paratha():
    items = ""
    for i in range(5):
        y = 620 - i * 32
        items += f'<ellipse cx="400" cy="{y}" rx="170" ry="46" fill="#ebc27c" stroke="#d6a453" stroke-width="4"/>'
    items += dots(400, 492, 140, 32, 30, ["#c98a32", "#b0702a"], 28, (4, 8))
    return frozen_box("PLAIN PARATHA", items, "gold", "#2a6040")


def spring_roll():
    items = ""
    for i in range(6):
        x, y = 290 + (i % 2) * 200, 450 + (i // 2) * 72
        items += f'<rect x="{x-80}" y="{y}" width="170" height="46" rx="23" fill="#e8b45a" transform="rotate(-8 {x} {y})"/>'
        items += f'<path d="M{x-50} {y+10} l20 26 M{x} {y+8} l20 26 M{x+50} {y+6} l20 26" stroke="#c98a32" stroke-width="4" transform="rotate(-8 {x} {y})"/>'
    return frozen_box("SPRING ROLLS", items, "teal", "#c8235f")


# ---------------------------------------------------------------- packing photos

def packing_box():
    b = shadow(400, 760, 270, 40)
    b += f'<path d="M140 380 l520 0 l0 370 l-520 0z" fill="#c9965a"/>'
    b += f'<path d="M140 380 l520 0 l-60 -90 l-400 0z" fill="#d9aa6e"/>'
    b += f'<path d="M140 380 l520 0" stroke="#a87443" stroke-width="5"/>'
    b += f'<path d="M290 430 l220 0 l0 240 l-220 0z" fill="#1f4d36"/>'
    b += f'<path d="M300 440 l200 0 l0 220 l-200 0z" fill="none" stroke="#e9b44c" stroke-width="5"/>'
    b += f'<path d="M400 470 c-30 22 -40 58 -22 90 c8 -26 20 -44 40 -60 c-14 20 -22 40 -24 66 c32 -14 40 -54 6 -96z" fill="#8ec93c"/>'
    b += f'<text x="400" y="625" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="34" fill="#fbf3e6">Living Foods</text>'
    b += f'<path d="M140 720 l520 0" stroke="#eb5919" stroke-width="12"/><path d="M140 735 l520 0" stroke="#0e9aa7" stroke-width="8"/>'
    return frame("cream", b)


def insulated_bag():
    b = shadow(400, 780, 260, 40)
    b += f'<path d="M290 300 q0 -110 110 -110 q110 0 110 110" stroke="#1f4d36" stroke-width="26" fill="none"/>'
    b += f'<path d="M160 300 l480 0 l-20 470 l-440 0z" fill="#1f4d36"/>'
    b += f'<path d="M160 300 l480 0 l0 40 l-480 0z" fill="#e9b44c"/>'
    b += f'<path d="M210 380 l380 0 l-10 340 l-360 0z" fill="none" stroke="#e9b44c" stroke-width="5" stroke-dasharray="16 10"/>'
    b += snowflake(400, 500, 80)
    b += f'<text x="400" y="660" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="40" fill="#fbf3e6">Keeps it cold</text>'
    b += f'<rect x="560" y="610" width="110" height="150" rx="16" fill="#9ad3e6" stroke="#fff" stroke-width="6"/>'
    b += f'<text x="615" y="700" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="22" fill="#1f4d36">ICE</text>'
    return frame("teal", b)


def dessert_box():
    b = shadow(400, 760, 260, 40)
    b += f'<path d="M170 400 l460 0 l0 340 l-460 0z" fill="#c8235f"/>'
    b += f'<path d="M150 360 l500 0 l0 70 l-500 0z" fill="#e0517f"/>'
    b += f'<path d="M380 360 l40 0 l0 380 l-40 0z" fill="#e9b44c"/><path d="M150 380 l500 0" stroke="#e9b44c" stroke-width="0"/>'
    b += f'<path d="M400 360 q-90 -110 -120 -40 q40 40 120 40 q80 0 120 -40 q-30 -70 -120 40z" fill="#e9b44c"/>'
    b += ''.join(f'<circle cx="{220+i*120}" cy="560" r="20" fill="#fbf3e6" opacity=".9"/><circle cx="{220+i*120}" cy="560" r="8" fill="#0e9aa7"/>' for i in range(4) if i != 1.5)
    b += f'<rect x="250" y="640" width="300" height="56" rx="10" fill="#fbf3e6"/>'
    b += f'<text x="400" y="680" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="32" fill="#c8235f">Sweet treats</text>'
    return frame("cream", b)


ART = {
    "biryani": biryani, "bun-kebab": bun_kebab, "chicken-burger": chicken_burger, "chicken-karahi": chicken_karahi,
    "daal-chawal": daal_chawal, "chicken-shawarma": shawarma, "banana-cake": banana_cake, "chocolate-brownie": chocolate_brownie,
    "kheer": kheer, "gulab-jamun": gulab_jamun, "gajar-ka-halwa": gajar_halwa,
    "fresh-milk": milk_bottle, "desi-dahi": dahi, "sweet-lassi": lassi, "desi-makhan": makhan, "fresh-paneer": paneer, "desi-ghee": ghee,
    "chicken-seekh-kebab": seekh_kebab, "chicken-nuggets": nuggets, "aloo-samosa": samosa, "chicken-shami-kebab": shami,
    "plain-paratha": paratha, "chicken-spring-rolls": spring_roll,
    "packing-box": packing_box, "packing-insulated-bag": insulated_bag, "packing-dessert-box": dessert_box,
}

for name, fn in ART.items():
    with open(os.path.join(OUT, f"{name}.svg"), "w") as fh:
        fh.write(fn())
print(len(ART), "drawings")
