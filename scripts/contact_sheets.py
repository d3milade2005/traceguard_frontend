"""Arrange captured screenshots for visual review; does not alter the originals."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path('artifacts')
names = ['landing', 'login', 'dashboard', 'runs', 'run-detail', 'system', 'docs-introduction', 'docs-quick-start', 'docs-unavailable']
for theme in ['dark', 'light']:
    for width in [1440, 1100, 390]:
        sheet = Image.new('RGB', (1500, 2100), '#d4d6db')
        draw = ImageDraw.Draw(sheet)
        for index, name in enumerate(names):
            file = root / 'after' / f'{name}-{theme}-{width}.png'
            if not file.exists():
                continue
            shot = Image.open(file).convert('RGB')
            shot.thumbnail((490, 665))
            x, y = (index % 3) * 500, (index // 3) * 700
            draw.text((x + 7, y + 5), f'{name} / {theme} / {width}', fill='#20242c')
            sheet.paste(shot, (x + 5, y + 25))
        sheet.save(root / f'contact-{theme}-{width}.jpg')
for group in ['interactions', 'states']:
    shots = sorted((root / group).glob('*.png'))
    for start in range(0, len(shots), 9):
        sheet = Image.new('RGB', (1500, 2100), '#d4d6db')
        draw = ImageDraw.Draw(sheet)
        for index, file in enumerate(shots[start:start+9]):
            shot = Image.open(file).convert('RGB')
            shot.thumbnail((490, 665))
            x, y = (index % 3) * 500, (index // 3) * 700
            draw.text((x + 7, y + 5), file.stem, fill='#20242c')
            sheet.paste(shot, (x + 5, y + 25))
        sheet.save(root / f'contact-{group}-{start//9+1}.jpg')
