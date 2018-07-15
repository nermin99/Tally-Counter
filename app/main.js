// import Substance from './classes/Substance';

/**
 * Global
 * NODEs
 */
const root = document.querySelector("#root");

/**
 * Objects
 */
var substanceS = [];

function init() {
  let subs = [
    new Substance(0, "Vitsippa"),
    new Substance(1, "Blåsippa"),
    new Substance(2, "Ros"),
    new Substance(3, "Vass"),
    new Substance(4, "Säv"),
    new Substance(5, "Kaveldun"),
    new Substance(6, "Gul"),
    new Substance(7, "Natearter"),
  ];
  substanceS = subs;

  if (typeof(Storage) !== "undefined") {
    // loads the saved substances
    if (localStorage.getItem('substances') !== null) {
      substanceS = load("substances");
    }
  }

  render();
  initLoadFromFile();
  window.addEventListener('keydown', runHotkey);
}
init();

function increment(substance) {
  substance.quantity++;
  animate(substance.id);
}

function decrement(substance) {
  if (substance.quantity == 0) return;
    substance.quantity--;
  render();
}

function addNew() {
  const n = document.querySelector('#number').value;

  // empty table
  if (substanceS.length == 0) {
    substanceS.push(new Substance(0));
    render();
    return;
  }

  for (let i = 0; i < n; i++) {
    const substance = new Substance(substanceS[substanceS.length-1].id + 1);
    substanceS.push(substance);
  }
  render();
}

function removeOld(id) {
  const substance = substanceS.find(substance => substance.id === id);

  substanceS.splice(substanceS.indexOf(substance), 1);
  render();
}

function animate(id) {
  const substanceRow = document.querySelector(`[data-id="${id}"]`);
  if (substanceRow.dataset.animating) return; // don't add another animation if current one is running

  substanceRow.classList.add('animate');
  substanceRow.dataset.animating = "true";

  substanceRow.addEventListener("transitionend", () => {
    // remove the class
    substanceRow.classList.remove("animate");
    substanceRow.addEventListener("transitionend", () => {
      substanceRow.dataset.animating = "false";
      render(); // render once the remove is complete
    });
  });
}

function render() {
  const currentAnimation = document.querySelector(".animate");
  if (currentAnimation && currentAnimation.dataset.animating) {
    return; // current
  }

  /* substanceS.sort((a, b) => {
    if (a.quantity == b.quantity) return 0;
    if (a.quantity < b.quantity) return -1;
    if (a.quantity > b.quantity) return 1;

  }).reverse(); */

  const html = `
        <table id="table" class="table table-striped table-bordered table-hover ${load('tSize')}">
          <thead class="thead-dark">
            <th scope="col">No</th>
            <th scope="col">Magn x</th>
            <th scope="col">Count part</th>
            <th scope="col">Tally key</th>
            <th scope="col">Species</th>
            <th scope="col">C/kol/100µ</th>
            <th scope="col">No count</th>
            <th scope="col">Size class</th>
            <th scope="col">Cell vol µm3</th>
            <th scope="col">Group</th>
            <th scope="col"></th>
            <th scope="col" colspan="2"></th>
          </thead>
          <tbody>
          ${ substanceS.map((substance, id) => {
            const hotkey = substance.tallyKey;
            return `
              <tr data-id="${substance.id}">
                <td class="id">${id}</td>
                <td class="magnification" contenteditable="true" oninput="saveEdit(this)">${substance.magnification}</td>
                <td class="countPart" contenteditable="true" oninput="saveEdit(this)">${substance.countPart}</td>
                <td class="tallyKey" onclick="assignHotkey(${substance.id})">${hotkey ? hotkey.shift ? "shift +" : "" : ""} ${hotkey ? hotkey.ctrl ? "ctrl +" : "" : ""} ${hotkey ? hotkey.alt ? "alt +" : "" : ""} ${hotkey ? hotkey.key : 'no key'}</td>
                <td class="species" contenteditable="true" oninput="saveEdit(this)">${substance.species}</td>
                <td class="cKoll100" contenteditable="true" oninput="saveEdit(this)">${substance.cKoll100}</td>
                <th class="quantity" contenteditable="true" oninput="saveEdit(this)">${substance.quantity}</th>
                <td class="sizeClass" contenteditable="true" oninput="saveEdit(this)">${substance.sizeClass}</td>
                <td class="cellvolume" contenteditable="true" oninput="saveEdit(this)">${substance.cellvolume}</td>
                <td class="group" contenteditable="true" oninput="saveEdit(this)">${substance.group}</td>
                <td class="alt1" contenteditable="true" oninput="saveEdit(this)">${substance.alt1}</td>
                <td class="alt2" contenteditable="true" oninput="saveEdit(this)">${substance.alt2}</td>
                <td> <i class="fas fa-minus-circle pointer" onclick="removeOld(${substance.id})"></i> </td>
              </tr>` }
            ).join("") }

              <tr>
                <th class="pointer" colspan="9" onclick="addNew()">
                  <i class="fas fa-plus-circle"></i>
                  <span>Lägg Till Rad</span>
                </th>
                <td colspan="4">
                  <input id="number" type="number" value="1">
                </td>
              </tr>
          </tbody>
        </table>`

  root.innerHTML = html;
  save("substances", substanceS);
}

function saveEdit(e) {
  const substance = substanceS.find(sub => sub.id == e.parentElement.dataset.id);

  // class names must === Substance property
  const attribute = e.classList.value;
  substance[attribute] = e.innerHTML;

  save("substances", substanceS);
}

/**
 * Hotkeys
 */
function assignHotkey(id) {
  let currentElem = document.querySelector(`[data-id='${id}']`);
  currentElem.querySelector(".tallyKey").innerText = "select key";

  window.removeEventListener('keyup', settingHotkey);
  window.addEventListener('keyup', (e) => {settingHotkey(id, e)}, { once:true });
  window.removeEventListener('keydown', runHotkey);
}

function settingHotkey(id, e) {
  e.preventDefault();

  const keyCombo = getKeyCombo(e);

  const otherSubstance = substanceS.find(substance => {
    return JSON.stringify(substance.tallyKey) === JSON.stringify(keyCombo);
  })

  // If another substance already has the keyCombo replace its
  if (otherSubstance) otherSubstance.tallyKey = null;

  const substance = substanceS.find(substance => substance.id === id);
  substance.tallyKey = keyCombo;

  render();
  window.addEventListener('keydown', runHotkey);
}

function runHotkey(e) {
  // Don't run on input
  if (e.target.contentEditable == "true") return;

  const keyCombo = getKeyCombo(e);

  const substance = substanceS.find(substance => {
    return JSON.stringify(substance.tallyKey) === JSON.stringify(keyCombo);
  });

  // If hotkey exists
  if (!substance) return;
  increment(substance);
}

function getKeyCombo(e) {
  let key = String.fromCharCode(e.keyCode);

  // Special characters
  if (String.fromCharCode(e.keyCode) != e.key.toUpperCase()) {
    if (e.key == "å" || e.key == "ä" || e.key == "ö" || e.key == "Å" || e.key == "Ä" || e.key == "Ö") {
      key = e.key.toUpperCase()
    } else {
      key = `${key} / ${e.key}`;
    }
  } else {
    // Å Ä Ö Space
    switch (e.keyCode) {
      // case 219:
      //   key = "Å";
      //   break;
      // case 222:
      //   key = "Ä";
      //   break;
      // case 186:
      //   key = "Ö";
      //   break;
      case 32:
        key = "SPACE"
    }
  }

  return {
    key: key,
    alt: e.altKey,
    ctrl: e.ctrlKey,
    shift: e.shiftKey
  }
  // return keyCombo;
}

/**
 * save & load - file
 */
function saveToFile() {
  const data = JSON.stringify(substanceS);
  let a = document.createElement("a");
  const file = new Blob([data], {type: "application/json"});

  a.href = URL.createObjectURL(file);
  // Save filename or cancel
  if (a.download = prompt("Ange namn på filen", "filnamn")) {} else {
    return;
  }
  a.click();
}

function initLoadFromFile() {
  let reader = new FileReader();
  const fileInput = document.querySelector("#fileInput");

  fileInput.addEventListener('change', fileInputChange);

  function fileInputChange() {
    // Only allow .json
    if (fileInput.files[0].type != "application/json") {
      alert("Fel filtyp!");
      return;
    }
    // Check if file uploaded pre reader run
    if (fileInput.files.length > 0) reader.readAsBinaryString(fileInput.files[fileInput.files.length - 1]);
  }

  reader.onload = function () {
    try {
      substanceS = JSON.parse(decodeURIComponent(escape(reader.result))); // decode UTF8 and parse result
      render();
      location.reload();
    } catch (error) {
      alert("Ett fel inträffade");
      console.log(error);
    }
  }
}

function loadFromFile() {
  const fileInput = document.querySelector("#fileInput");
  fileInput.click();
}

/**
 * Aside buttons
 */
function save(key, value) {
  try {
    const data = JSON.stringify(value);
    localStorage.setItem(key, data);
  }  catch(error) {
    console.error("CANT SAVE", error);
  }
}

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    console.error("CANT LOAD", error);
  }
}

function resetTable() {
  if (confirm('Är du säker på att du vill återställa tabellen?')) {
    localStorage.clear();
    location.reload();
  }
}

function exportExcel() {
  let filename;
  // Save filename or cancel
  if (filename = prompt("Ange namn på filen", "filnamn")) {} else {
    return;
  }
  filename += ".csv";

  const divider = ";";
  let csv = `\ufeffNamn${divider}Zoom${divider}Antal\r\n`;

  csv += substanceS.map(substance => {
    return `${substance.species + divider + substance.magnification + divider + substance.quantity}\r\n`;
  }).join("");

  const blob = new Blob([csv], { type: 'text;charset=UTF-8;' });
  if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, filename);
  } else {
      let link = document.createElement("a");
      if (link.download !== undefined) { // feature detection
          // Browsers that support HTML5 download attribute
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  }
}