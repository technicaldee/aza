import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadTranslation(filename) {
  return JSON.parse(readFileSync(resolve(__dirname, filename), "utf8"));
}

export const soundDeviceTranslations = {
  English: loadTranslation("en.json"),
  Pidgin: loadTranslation("pidgin.json"),
  Yoruba: loadTranslation("yoruba.json"),
  Hausa: loadTranslation("hausa.json"),
  Ibibio: loadTranslation("ibibio.json")
};

export function renderSoundDeviceMessage(language, key, variables = {}) {
  const template =
    soundDeviceTranslations[language]?.[key] ||
    soundDeviceTranslations.English[key] ||
    "";

  return template.replace(/\{(\w+)\}/g, (_, variableName) => {
    return String(variables[variableName] ?? "");
  });
}
