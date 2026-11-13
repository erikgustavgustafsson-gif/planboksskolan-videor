// node frilagg.mjs <del> <antal delar> fil1 fil2 ...  – frilägger kand/<namn>.jpg -> ut/<namn>.png (hoppar över färdiga)
import { removeBackground } from "@imgly/background-removal-node";
import fs from "fs";
const [del, delar, ...filer] = process.argv.slice(2);
fs.mkdirSync("ut", { recursive: true });
for (const [i, k] of filer.entries()) {
  if (i % +delar !== +del) continue;
  const inn = `${process.cwd()}/kand/${k}.jpg`, ut = `ut/${k}.png`;
  if (!fs.existsSync(inn) || fs.existsSync(ut)) continue;
  try {
    const blob = await removeBackground("file://" + inn, { model: "medium", output: { format: "image/png", quality: 1 } });
    fs.writeFileSync(ut, Buffer.from(await blob.arrayBuffer())); console.log("ok", k);
  } catch (e) { console.log("fel", k, e.message); }
}
