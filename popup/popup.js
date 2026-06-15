const helperStatus = document.getElementById("helper-status");
const locationsContainer = document.getElementById("locations");
const lastResult = document.getElementById("last-result");
const openOptionsButton = document.getElementById("open-options");
const checkHelperButton = document.getElementById("check-helper");
const addLocationForm = document.getElementById("add-location-form");
const addLocationPathInput = document.getElementById("add-location-path");
const addLocationStatus = document.getElementById("add-location-status");

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
    empty.textContent = "No folders saved yet. Add one here or open Manage.";
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
        locationId: checkbox.checked ? location.id : null
      });
      await refresh();
    });

    const path = document.createElement("div");
    path.className = "location-path";
    path.textContent = location.path;

    head.append(checkbox);
    label.append(head, path);
    locationsContainer.append(label);
  }
}

function setAddLocationStatus(message, isError = false) {
  addLocationStatus.textContent = message;
  addLocationStatus.className = `status-text ${isError ? "error" : ""}`.trim();
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

addLocationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAddLocationStatus("");

  try {
    await sendMessage({
      type: "addLocation",
      payload: {
        path: addLocationPathInput.value
      }
    });
    addLocationForm.reset();
    setAddLocationStatus("Folder added.");
    await refresh();
  } catch (error) {
    setAddLocationStatus(error?.message ?? String(error), true);
  }
});

void Promise.all([refresh(), checkHelper()]);
