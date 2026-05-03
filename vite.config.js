import { defineConfig } from "vite";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";

function updatePastEvents() {
  const FILE = "src/script.js";
  const content = readFileSync(FILE, "utf-8");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function parseDate(str) {
    const [d, m, y] = str.split(".").map(Number);
    return new Date(2000 + y, m - 1, d);
  }

  let count = 0;
  const updated = content.replace(
    /date:\s*"(\d{2}\.\d{2}\.\d{2})",\s*past:\s*false/g,
    (match, dateStr) => {
      if (parseDate(dateStr) < today) {
        count++;
        return match.replace("past: false", "past: true");
      }
      return match;
    }
  );

  if (count > 0) writeFileSync(FILE, updated, "utf-8");
}

const pastEventsPlugin = {
  name: "update-past-events",
  handleHotUpdate({ server }) {
    updatePastEvents();
    server.ws.send({ type: "full-reload" });
    return [];
  },
  buildStart() {
    updatePastEvents();
  },
};

export default defineConfig({
  plugins: [pastEventsPlugin],
  build: {
    rollupOptions: {
      input: {
        main:    resolve(__dirname, "index.html"),
        anfrage: resolve(__dirname, "anfrage.html"),
      },
    },
  },
});
