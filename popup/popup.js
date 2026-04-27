const helperStatus = document.getElementById("helper-status");
const locationsContainer = document.getElementById("locations");
const lastResult = document.getElementById("last-result");
const openOptionsButton = document.getElementById("open-options");
const checkHelperButton = document.getElementById("check-helper");

async function sendMessage(message) {
  return browser.runtime.sendMessage(message);
}

function setHelperStatus(label, className = "") {
  helperStatus.textContent = label;
  helperStatus.className = `status ${className}`.trim();
}

function renderLastResult(result) {
  if (!result) {
    lastResult.textContent = "No download has been handled yet.";
    return;
  }

  const prefix = result.ok ? "Last move succeeded." : "Last move failed.";
  const fileName = result.fileName ? ` File: ${result.fileName}.` : "";
  const target = result.targetDirectory ? ` Target: ${result.targetDirectory}.` : "";
  lastResult.textContent = `${prefix}${fileName}${target} ${result.message}`;
}

async function renderLocations(state) {
  locationsContainer.textContent = "";

  if (!state.locations.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No folders saved yet. Use Manage to add one.";
    locationsContainer.append(empty);
    return;
  }

  for (const location of state.locations) {
    const label = document.createElement("label");
    label.className = `location ${state.activeLocationId === location.id ? "active" : ""}`.trim();

    const head = document.createElement("div");
    head.className = "location-head";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "location-toggle";
    checkbox.checked = state.activeLocationId === location.id;
    checkbox.addEventListener("change", async () => {
      await sendMessage({
        type: "setActiveLocation",
        locationId: location.id
      });
      await refresh();
    });

    const name = document.createElement("span");
    name.className = "location-name";
    name.textContent = location.name;

    const path = document.createElement("div");
    path.className = "location-path";
    path.textContent = location.path;

    head.append(checkbox, name);
    label.append(head, path);
    locationsContainer.append(label);
  }
}

async function checkHelper() {
  setHelperStatus("Checking...");

  try {
    await sendMessage({ type: "pingNativeHost" });
    setHelperStatus("Connected", "ok");
  } catch (error) {
    setHelperStatus("Not installed", "error");
  }
}

async function refresh() {
  const state = await sendMessage({ type: "getState" });
  await renderLocations(state);
  renderLastResult(state.lastMoveResult);
}

openOptionsButton.addEventListener("click", () => {
  void browser.runtime.openOptionsPage();
});

checkHelperButton.addEventListener("click", () => {
  void checkHelper();
});

void Promise.all([refresh(), checkHelper()]);
