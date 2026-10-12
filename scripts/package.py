import json
import pathlib
import zipfile

root = pathlib.Path(__file__).resolve().parents[1]
extension = root / "extension"
manifest = json.loads((extension / "manifest.json").read_text())
version = manifest["version"]
output = root / "artifacts"
output.mkdir(exist_ok=True)
for kind, prefix in [("store", ""), ("install", "google-calendar-event-length/")]:
    target = output / f"google-calendar-event-length-{version}-{kind}.zip"
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(extension.rglob("*")):
            if file.is_file():
                archive.write(file, prefix + file.relative_to(extension).as_posix())
    with zipfile.ZipFile(target) as archive:
        assert prefix + "manifest.json" in archive.namelist()
    print(target)
