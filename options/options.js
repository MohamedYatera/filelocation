const form = document.getElementById("location-form");
const nameInput = document.getElementById("location-name");
const pathInput = document.getElementById("location-path");
const locationsContainer = document.getElementById("locations");
const formStatus = document.getElementById("form-status");

async function sendMessage(message) {
  return browser.runtime.sendMessage(message);
}

function setStatus(message, isError = false) {
  formStatus.textContent = message;
  formStatus.style.color = isError ? "#972d2d" : "#665f58";
}

async function render() {
  const state = await sendMessage({ type: "getState" });
  locationsContainer.textContent = "";

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
        locationId: location.id
      });
      await render();
    });

    const name = document.createElement("div");
    name.className = "location-name";
    name.textContent = location.name;

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

    title.append(checkbox, name);
    top.append(title, removeButton);
    article.append(top, path);
    locationsContainer.append(article);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  try {
    await sendMessage({
      type: "addLocation",
      payload: {
        name: nameInput.value,
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
