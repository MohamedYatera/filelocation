const form = document.getElementById("location-form");
const pathInput = document.getElementById("location-path");
const locationsContainer = document.getElementById("locations");
const formStatus = document.getElementById("form-status");
const routingForm = document.getElementById("routing-form");
const respectManualSaveLocationInput = document.getElementById("respect-manual-save-location");
const browserDefaultDownloadDirectoryInput = document.getElementById("browser-default-download-directory");
const routingStatus = document.getElementById("routing-status");

async function sendMessage(message) {
  return browser.runtime.sendMessage(message);
}

function setStatus(message, isError = false) {
  formStatus.textContent = message;
  formStatus.style.color = isError ? "#972d2d" : "#665f58";
}

function setRoutingStatus(message, isError = false) {
  routingStatus.textContent = message;
  routingStatus.style.color = isError ? "#972d2d" : "#665f58";
}

async function render() {
  const state = await sendMessage({ type: "getState" });
  locationsContainer.textContent = "";
  respectManualSaveLocationInput.checked = Boolean(state.respectManualSaveLocation);
  browserDefaultDownloadDirectoryInput.value = state.browserDefaultDownloadDirectory ?? "";

  if (!state.locations.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No folders saved yet.";
    locationsContainer.append(empty);
    return;
  }

  for (const location of state.locations) {
    const article = document.createElement("article");
    article.className = `location ${state.activeLocationId === location.id ? "active" : ""}`.trim();

    const top = document.createElement("div");
    top.className = "location-top";

    const title = document.createElement("div");
    title.className = "location-title";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "location-toggle";
    checkbox.checked = state.activeLocationId === location.id;
    checkbox.addEventListener("change", async () => {
      await sendMessage({
        type: "setActiveLocation",
        locationId: checkbox.checked ? location.id : null
      });
      await render();
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", async () => {
      await sendMessage({
        type: "removeLocation",
        locationId: location.id
      });
      await render();
    });

    const path = document.createElement("div");
    path.className = "location-path";
    path.textContent = location.path;

    title.append(checkbox);
    top.append(title, removeButton);
    article.append(top, path);
    locationsContainer.append(article);
  }
}

routingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setRoutingStatus("");

  try {
    await sendMessage({
      type: "saveRoutingSettings",
      payload: {
        respectManualSaveLocation: respectManualSaveLocationInput.checked,
        browserDefaultDownloadDirectory: browserDefaultDownloadDirectoryInput.value
      }
    });
    setRoutingStatus("Routing settings saved.");
    await render();
  } catch (error) {
    setRoutingStatus(error?.message ?? String(error), true);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  try {
    await sendMessage({
      type: "addLocation",
      payload: {
        path: pathInput.value
      }
    });
    form.reset();
    setStatus("Folder added.");
    await render();
  } catch (error) {
    setStatus(error?.message ?? String(error), true);
  }
});

void render();
