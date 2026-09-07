import json, sys, os
from collections import Counter

with open(sys.argv[1], encoding="utf-8") as f:
    data = json.load(f)

exts = {".o", ".cmake", ".ninja", ".bin", ".check_cache", ".verify_globs", ".cpp", ".c", ".a", ".so", ".mat", ".int", ".fst", ".ie", ".stats", ".dubm", ".mdl", ".ppn", ".conf", ".example"}
sel = [i for i in data if i["extension"] in exts]
print("seleccion:", len(sel))
# Primer segmento de ruta
c = Counter(i["ruta"].split("/")[0] for i in sel)
print("por primer directorio:", dict(c))
for i in sel[:80]:
    print(i["extension"], i["ruta"])
