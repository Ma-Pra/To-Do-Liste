/*===============================================================DOM zugriffe und Globale Variablen=================================================================================*/

//DOM zugriff
const input = document.getElementById("input");
const addBtn = document.getElementById("addBtn");
const delBtn = document.getElementById("delBtn");
const statusElement = document.getElementById("status");
const filterSelect = document.getElementById("filterSelect");
const searchInput = document.getElementById("searchInput");
const list = document.getElementById("list");
const main = document.getElementsByClassName("container");

//Variablen
const STORAGE_KEY = "todos";
let items = [];
let editingId = null;
let currentFilter = "all";
let currentQuery = "";

/*=============================================================Filter===================================================================================*/

//Funktion um Items filtern und durchsuchen
function getFilteredItems() {
  items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  // Filtert durch items und gibt alle Objekte die dem status von currentFilter entsprächen
  let filtered = items.filter((item) => {
    if (currentFilter === "open") return !item.done;
    if (currentFilter === "done") return item.done;
    return true;
  });

  // Geht durch die gefilterten Items und gibt nur die Items zurück die den gesuchten Text beinhalten
  const query = currentQuery.trim().toLowerCase();
  if (!query) return filtered;

  return filtered.filter((item) => item.content?.toLowerCase().includes(query));
}

// Prüft, ob etwas am Filter oder Suchfeld verändert wurde
filterSelect.addEventListener("change", () => {
  currentFilter = filterSelect.value;
  recreateNewList();
  statusOutput("Neutral", `Filter: ${currentFilter}`);
});

searchInput.addEventListener("input", () => {
  currentQuery = searchInput.value.toLowerCase();
  recreateNewList();
  statusOutput("Neutral", `Suche: "${currentQuery}"`);
});

/*================================================================Liste neu aufbauen================================================================================*/

// Erstellt die liste neu
function recreateNewList() {
  list.innerHTML = "";
  let data = getFilteredItems();
  data.forEach((element) => {
    //Erstellt die Elemente für die liste
    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    if (element.done) {
      li.classList.add("done");
    }

    const textContainer = document.createElement("div");

    const outputSpan = document.createElement("span");
    outputSpan.innerText = element.content;

    const editBtn = document.createElement("button");
    editBtn.innerText = "Bearbeiten";

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "Löschen";

    //Fügt die elemente dem DOM hinzu
    li.appendChild(checkbox);
    li.appendChild(textContainer);
    textContainer.appendChild(outputSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });

  registriereButtonEvents();
}

/*===================================================================Funktionen der Buttons und der Checkbox in der Liste=============================================================================*/

function registriereButtonEvents() {
  const listItems = list.querySelectorAll("li");
  const filteredItems = getFilteredItems();

  listItems.forEach((element, index) => {
    const checkbox = element.querySelector("input[type=checkbox]");
    const [editBtn, delBtn] = element.querySelectorAll("button");
    const item = filteredItems[index];

    setupCheckbox(checkbox, item);
    setupEditButton(editBtn, item, index);
    setupDeleteButton(delBtn, item);
  });
}

//Checkbox Funktion
function setupCheckbox(checkbox, item) {
  checkbox.checked = item.done;

  checkbox.addEventListener("change", () => {
    const realItemIndex = items.findIndex((x) => x.id === item.id);
    if (realItemIndex !== -1) {
      items[realItemIndex].done = checkbox.checked;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      recreateNewList();
    }
  });
}

//Bearbeiten Button Funktion
function setupEditButton(button, item, index) {
  button.addEventListener("click", () => {
    input.value = item.content;
    editingId = item.id;
    addBtn.innerText = "Änderung speichern";
    statusOutput("Neutral", `Eintrag Nr.${index + 1} wird bearbeitet`);
  });
}

//Löschen Button Funktion
function setupDeleteButton(button, item) {
  button.addEventListener("click", () => {
    const deletedId = item.id;
    items = items.filter((x) => x.id !== deletedId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    recreateNewList();
    statusOutput("Löschen", "Eintrag wurde gelöscht");

    if (editingId === deletedId) {
      editingId = null;
      addBtn.innerText = "Hinzufügen";
      input.value = "";
    }
  });
}

/*================================================================Hinzufügen und bearbeiten von Input================================================================================*/
// Funktionen bei click auf den Button oder Enter ausführen
addBtn.addEventListener("click", handleAddOrEdit);
input.addEventListener("keydown", handleEnterKey);

//Ruft die Funktion auch auf, wenn Enter gedrückt wird
function handleEnterKey(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleAddOrEdit();
  }
}
// Entscheidet, welche Funktion aufgerufen wird
function handleAddOrEdit() {
  const inputTrim = input.value.trim();

  if (!inputTrim) {
    statusOutput("Neutral", "Bitte gebe ein ToDo ein");
    return;
  }
  if (editingId) {
    updateItem(inputTrim);
  } else {
    addItem(inputTrim);
  }

  input.value = "";
  recreateNewList();
}
// Items hinzufügen
function addItem(content) {
  const newItem = {
    id: Date.now(),
    content,
    done: false,
    createdAt: new Date().toISOString(),
  };

  items.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  statusOutput("Hinzufügen", "Eintrag wurde hinzugefügt");
}
//Items bearbeiten
function updateItem(content) {
  const index = items.findIndex((item) => item.id === editingId);
  if (index !== -1) {
    items[index].content = content;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    statusOutput("Neutral", "Eintrag wurde geändert");
  }

  editingId = null;
  addBtn.innerText = "Hinzufügen";
}

/*=====================================================Löschen des gesamten Inhalts===========================================================================================*/

delBtn.addEventListener("click", () => {
  // Overlay zum Blockieren der Seite
  const blocker = document.createElement("div");
  blocker.className = "blocker-overlay";

  // Bestätigungsbox erstellen
  const confirmBox = document.createElement("div");
  confirmBox.className = "confirm-box";
  confirmBox.innerHTML = `
    <span>Bist du sicher, dass du ALLES löschen möchtest?</span>
    <div class="button-group">
      <button class="confirm-delete">Löschen</button>
      <button class="confirm-cancel">Abbrechen</button>
    </div>
  `;

  // DOM einfügen
  main[0].append(blocker, confirmBox);

  // Event-Listener für Löschen
  confirmBox.querySelector(".confirm-delete").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    items = [];
    editingId = null;
    input.value = "";
    addBtn.innerText = "Hinzufügen";
    list.innerHTML = "";
    statusOutput("Löschen", "Alle Einträge gelöscht");
    blocker.remove();
    confirmBox.remove();
  });

  // Event-Listener für Abbrechen
  confirmBox.querySelector(".confirm-cancel").addEventListener("click", () => {
    blocker.remove();
    confirmBox.remove();
  });
});

/*===============================================================Status=================================================================================*/

//Status Funktion
function statusOutput(aufgabe, output) {
  statusColorChange(aufgabe);
  statusElement.innerText = output;
}

// Status Background color change
function statusColorChange(statusState) {
  // Erst alle möglichen Status-Klassen entfernen
  statusElement.classList.remove("statusGreen", "statusRed", "statusNeutral");

  // Neue Klasse anhand des Status setzen
  switch (statusState) {
    case "Neutral":
      statusElement.classList.add("statusNeutral");
      break;
    case "Löschen":
      statusElement.classList.add("statusRed");
      break;
    case "Hinzufügen":
      statusElement.classList.add("statusGreen");
      break;
    default:
      // Fallback für unbekannter Status
      console.warn("Unbekannter Status:", statusState);
  }
}

/*==============================================================Inhalt beim des Lokalen Speichers laden beim laden der Seite==================================================================================*/

document.addEventListener("DOMContentLoaded", () => {
  items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  recreateNewList();
  statusColorChange("Neutral");
  statusElement.innerText = "Vorhandene Einträge geladen.";
});
