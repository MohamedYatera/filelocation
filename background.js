const HOST_NAME = "com.filelocation.download_path_switcher";
const DEFAULT_STATE = {
  locations: [],
  activeLocationId: null,
  lastMoveResult: null
};

const processedDownloads = new Set();

async function getState() {
  const stored = await browser.storage.local.get(DEFAULT_STATE);
  return {
    locations: Array.isArray(stored.locations) ? stored.locations : [],
    activeLocationId: stored.activeLocationId ?? null,
    lastMoveResult: stored.lastMoveResult ?? null
  };
}

async function saveState(partialState) {
  await browser.storage.local.set(partialState);
  return getState();
}

function normalizePath(path) {
  return typeof path === "string" ? path.trim() : "";
}

function isValidWindowsPath(path) {
  return /^[A-Za-z]:\\/.test(path) || /^\\\\[^\\]+\\[^\\]+/.test(path);
}

async function setActiveLocation(locationId) {
  const state = await getState();

  if (locationId !== null && !state.locations.some((location) => location.id === locationId)) {
    throw new Error("The selected location does not exist.");
  }

  return saveState({ activeLocationId: locationId });
}

async function addLocation(payload) {
  const state = await getState();
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const path = normalizePath(payload?.path);

  if (!name) {
    throw new Error("A name is required.");
  }

  if (!isValidWindowsPath(path)) {
    throw new Error("Use an absolute Windows path such as C:\\Downloads\\Invoices.");
  }

  const location = {
    id: crypto.randomUUID(),
    name,
    path
  };

  const nextLocations = [...state.locations, location];
  const nextState = {
    locations: nextLocations
  };

  if (!state.activeLocationId) {
    nextState.activeLocationId = location.id;
  }

  return saveState(nextState);
}

async function removeLocation(locationId) {
  const state = await getState();
  const nextLocations = state.locations.filter((location) => location.id !== locationId);

  if (nextLocations.length === state.locations.length) {
    return state;
  }

  const nextState = {
    locations: nextLocations,
    activeLocationId: state.activeLocationId === locationId ? nextLocations[0]?.id ?? null : state.activeLocationId
  };

  return saveState(nextState);
}

async function pingNativeHost() {
  return browser.runtime.sendNativeMessage(HOST_NAME, { type: "ping" });
}

async function moveCompletedDownload(downloadId) {
  if (processedDownloads.has(downloadId)) {
    return;
  }

  processedDownloads.add(downloadId);

  try {
    const state = await getState();
    const activeLocation = state.locations.find((location) => location.id === state.activeLocationId);

    if (!activeLocation) {
      return;
    }

    const [downloadItem] = await browser.downloads.search({ id: downloadId });

    if (!downloadItem?.filename) {
      throw new Error("Firefox did not expose a local filename for this download.");
    }

    const response = await browser.runtime.sendNativeMessage(HOST_NAME, {
      type: "moveDownload",
      sourcePath: downloadItem.filename,
      targetDirectory: activeLocation.path
    });

    await browser.storage.local.set({
      lastMoveResult: {
        ok: Boolean(response?.ok),
        fileName: downloadItem.filename.split(/[/\\]/).pop() ?? downloadItem.filename,
        message: response?.message ?? (response?.ok ? "Moved download." : "The native host returned an unknown error."),
        targetDirectory: response?.targetDirectory ?? activeLocation.path,
        finalPath: response?.finalPath ?? null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    await browser.storage.local.set({
      lastMoveResult: {
        ok: false,
        fileName: null,
        message: error?.message ?? String(error),
        targetDirectory: null,
        finalPath: null,
        timestamp: new Date().toISOString()
      }
    });
  }
}

browser.runtime.onInstalled.addListener(async () => {
  const state = await browser.storage.local.get(DEFAULT_STATE);

  if (!Array.isArray(state.locations)) {
    await browser.storage.local.set(DEFAULT_STATE);
  }
});

browser.downloads.onChanged.addListener((delta) => {
  if (delta.state?.current === "complete") {
    void moveCompletedDownload(delta.id);
  }
});

browser.downloads.onErased.addListener((downloadId) => {
  processedDownloads.delete(downloadId);
});

browser.runtime.onMessage.addListener((message) => {
  switch (message?.type) {
    case "getState":
      return getState();
    case "addLocation":
      return addLocation(message.payload);
    case "removeLocation":
      return removeLocation(message.locationId);
    case "setActiveLocation":
      return setActiveLocation(message.locationId);
    case "pingNativeHost":
      return pingNativeHost();
    default:
      return Promise.reject(new Error("Unknown message type."));
  }
});
