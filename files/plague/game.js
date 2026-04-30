const colonyData = [
  {
    id: "new_hampshire",
    name: "New Hampshire",
    group: "Northern Colony",
    polygon: "482,58 548,73 558,188 505,208 463,156",
    label: [512, 135],
    port: [562, 181],
    neighbors: ["massachusetts"],
    portLinks: ["massachusetts", "new_york"],
  },
  {
    id: "massachusetts",
    name: "Massachusetts",
    group: "Northern Colony",
    polygon: "455,202 558,194 655,221 687,255 644,292 538,276 452,258",
    label: [572, 243],
    port: [682, 268],
    neighbors: ["new_hampshire", "rhode_island", "connecticut"],
    portLinks: ["new_hampshire", "rhode_island", "new_york"],
  },
  {
    id: "rhode_island",
    name: "Rhode Island",
    group: "Northern Colony",
    polygon: "610,317 649,316 659,360 629,379 602,354",
    label: [631, 347],
    port: [664, 359],
    neighbors: ["massachusetts", "connecticut"],
    portLinks: ["massachusetts", "connecticut", "new_york"],
  },
  {
    id: "connecticut",
    name: "Connecticut",
    group: "Northern Colony",
    polygon: "462,301 606,309 595,371 466,365",
    label: [532, 342],
    port: [603, 367],
    neighbors: ["massachusetts", "rhode_island", "new_york"],
    portLinks: ["rhode_island", "new_york"],
  },
  {
    id: "new_york",
    name: "New York",
    group: "Middle Colony",
    polygon: "189,130 459,142 441,365 503,415 457,474 305,438 160,350 130,224",
    label: [306, 286],
    port: [505, 431],
    neighbors: ["connecticut", "new_jersey", "pennsylvania"],
    portLinks: ["massachusetts", "connecticut", "new_jersey"],
  },
  {
    id: "pennsylvania",
    name: "Pennsylvania",
    group: "Middle Colony",
    polygon: "115,424 418,455 397,591 160,610 86,538",
    label: [250, 528],
    port: null,
    neighbors: ["new_york", "new_jersey", "delaware"],
    portLinks: [],
  },
  {
    id: "new_jersey",
    name: "New Jersey",
    group: "Middle Colony",
    polygon: "432,443 505,454 498,587 440,608 405,548",
    label: [459, 524],
    port: [506, 551],
    neighbors: ["new_york", "pennsylvania", "delaware"],
    portLinks: ["new_york", "delaware"],
  },
  {
    id: "delaware",
    name: "Delaware",
    group: "Middle Colony",
    polygon: "396,606 452,618 458,686 410,699 381,651",
    label: [420, 654],
    port: [463, 667],
    neighbors: ["pennsylvania", "new_jersey"],
    portLinks: ["new_jersey"],
  },
];

const outbreakYears = [
  {
    year: 1775,
    fact: "Smallpox was already raging in British-occupied Boston and also struck the Continental Army during the invasion of Canada.",
  },
  {
    year: 1776,
    fact: "After the British evacuated Boston, refugees and returning movement helped make the outbreak harder to contain across Massachusetts.",
  },
  {
    year: 1777,
    fact: "George Washington ordered Continental soldiers inoculated against smallpox, creating one of the first large military immunization programs in American history.",
  },
  {
    year: 1778,
    fact: "The epidemic had moved beyond the eastern colonies, reaching routes into New Spain, including Texas and New Orleans.",
  },
  {
    year: 1779,
    fact: "Smallpox spread into Mexico, where Mexico City suffered a severe epidemic that killed many thousands.",
  },
  {
    year: 1780,
    fact: "The epidemic reached Pueblo communities in present-day New Mexico as it pushed farther across the continent.",
  },
  {
    year: 1781,
    fact: "Smallpox continued traveling through wartime movement, trade routes, and communities with little prior immunity.",
  },
  {
    year: 1782,
    fact: "Reports placed smallpox at Hudson's Bay Company interior trading posts, showing how far the epidemic had spread.",
  },
];

const state = {
  yearIndex: 0,
  points: 6,
  trust: 100,
  selected: null,
  infected: new Set(["massachusetts"]),
  exposed: new Set(["rhode_island"]),
  quarantined: new Set(),
  closedRoads: new Set(),
  closedPorts: new Set(),
  gameOver: false,
};

const map = document.querySelector("#regions");
const ports = document.querySelector("#ports");
const routeLayer = document.querySelector("#routes");
const logList = document.querySelector("#log-list");

const regionLookup = Object.fromEntries(colonyData.map((region) => [region.id, region]));

function roadKey(a, b) {
  return [a, b].sort().join("-");
}

function addLog(message) {
  const item = document.createElement("li");
  item.textContent = message;
  logList.prepend(item);
  while (logList.children.length > 8) {
    logList.lastElementChild.remove();
  }
}

function buildBoard() {
  colonyData.forEach((region) => {
    const shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    shape.setAttribute("points", region.polygon);
    shape.setAttribute("class", "region");
    shape.setAttribute("tabindex", "0");
    shape.setAttribute("role", "button");
    shape.dataset.id = region.id;
    shape.setAttribute("aria-label", region.name);
    shape.addEventListener("click", () => selectRegion(region.id));
    shape.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectRegion(region.id);
      }
    });
    map.append(shape);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", region.label[0]);
    label.setAttribute("y", region.label[1]);
    label.setAttribute("class", "region-label");
    label.textContent = region.name.replace(" ", "\n");
    map.append(label);

    if (region.port) {
      const port = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      port.setAttribute("cx", region.port[0]);
      port.setAttribute("cy", region.port[1]);
      port.setAttribute("r", "10");
      port.setAttribute("class", "port");
      port.dataset.id = region.id;
      ports.append(port);
    }
  });
}

function selectRegion(id) {
  state.selected = id;
  render();
}

function isClosedBetween(a, b) {
  return state.closedRoads.has(roadKey(a, b));
}

function regionStatus(id) {
  if (state.quarantined.has(id)) return "Quarantined";
  if (state.infected.has(id)) return "Infected";
  if (state.exposed.has(id)) return "Exposed";
  return "Healthy";
}

function spreadChance(from, to, viaPort = false) {
  let chance = viaPort ? 0.36 : 0.42;
  if (state.quarantined.has(from)) chance -= 0.24;
  if (state.quarantined.has(to)) chance -= 0.28;
  if (!viaPort && isClosedBetween(from, to)) chance -= 0.26;
  if (viaPort && (state.closedPorts.has(from) || state.closedPorts.has(to))) chance -= 0.24;
  return Math.max(0.04, chance);
}

function trySpread() {
  const newlyExposed = new Set();
  const newlyInfected = new Set(state.exposed);

  state.infected.forEach((id) => {
    const region = regionLookup[id];
    region.neighbors.forEach((neighborId) => {
      if (state.infected.has(neighborId) || state.exposed.has(neighborId)) return;
      if (Math.random() < spreadChance(id, neighborId)) {
        newlyExposed.add(neighborId);
      }
    });

    region.portLinks.forEach((neighborId) => {
      if (state.infected.has(neighborId) || state.exposed.has(neighborId)) return;
      if (Math.random() < spreadChance(id, neighborId, true)) {
        newlyExposed.add(neighborId);
      }
    });
  });

  newlyInfected.forEach((id) => {
    state.exposed.delete(id);
    state.infected.add(id);
  });

  newlyExposed.forEach((id) => state.exposed.add(id));

  if (newlyInfected.size > 0) {
    addLog(`${names([...newlyInfected])} moved from exposure into active infection.`);
  }
  if (newlyExposed.size > 0) {
    addLog(`New suspected cases appeared in ${names([...newlyExposed])}.`);
  }
  if (newlyInfected.size === 0 && newlyExposed.size === 0) {
    addLog("No new spread was reported this year.");
  }
}

function names(ids) {
  return ids.map((id) => regionLookup[id].name).join(", ");
}

function spend(cost, trustCost) {
  if (state.points < cost || state.gameOver) return false;
  state.points -= cost;
  state.trust = Math.max(0, state.trust - trustCost);
  return true;
}

function quarantineSelected() {
  const id = state.selected;
  if (!id || state.quarantined.has(id) || !spend(2, 9)) return;
  state.quarantined.add(id);
  addLog(`${regionLookup[id].name} entered quarantine by local order.`);
  render();
}

function cordonSelected() {
  const id = state.selected;
  if (!id || !spend(2, 7)) return;
  regionLookup[id].neighbors.forEach((neighborId) => {
    state.closedRoads.add(roadKey(id, neighborId));
  });
  addLog(`Road cordons tightened around ${regionLookup[id].name}.`);
  render();
}

function closePortSelected() {
  const id = state.selected;
  const region = regionLookup[id];
  if (!id || !region.port || state.closedPorts.has(id) || !spend(1, 6)) return;
  state.closedPorts.add(id);
  addLog(`${region.name}'s port traffic was suspended.`);
  render();
}

function advanceYear() {
  if (state.gameOver) return;
  state.yearIndex += 1;
  state.points = Math.min(8, state.points + 3);
  state.trust = Math.max(0, state.trust - state.infected.size * 2);
  trySpread();
  checkEnd();
  render();
}

function checkEnd() {
  if (state.infected.size >= 5) {
    endGame("Outbreak Uncontained", "The outbreak overwhelmed regional controls before 1782. Earlier cordons around New York and the coastal ports can buy valuable time.");
  } else if (state.yearIndex >= outbreakYears.length - 1) {
    endGame("Containment Held", "You kept the outbreak below the crisis threshold through 1782. The colonies are strained, but the chain of transmission has slowed.");
  } else if (state.trust <= 0) {
    endGame("Authority Collapsed", "Closures outpaced public trust. The disease may slow, but orders are no longer being followed consistently.");
  }
}

function endGame(title, copy) {
  state.gameOver = true;
  document.querySelector("#result-title").textContent = title;
  document.querySelector("#result-copy").textContent = copy;
  document.querySelector("#result-modal").hidden = false;
}

function resetGame() {
  state.yearIndex = 0;
  state.points = 6;
  state.trust = 100;
  state.selected = null;
  state.infected = new Set(["massachusetts"]);
  state.exposed = new Set(["rhode_island"]);
  state.quarantined = new Set();
  state.closedRoads = new Set();
  state.closedPorts = new Set();
  state.gameOver = false;
  logList.innerHTML = "";
  document.querySelector("#result-modal").hidden = true;
  addLog("Rumors of exposure are moving south along coastal routes.");
  render();
}

function render() {
  const currentYear = outbreakYears[state.yearIndex];
  document.querySelector("#year").textContent = currentYear.year;
  document.querySelector("#fact-year").textContent = currentYear.year;
  document.querySelector("#year-fact-copy").textContent = currentYear.fact;
  document.querySelector("#infected-count").textContent = state.infected.size;
  document.querySelector("#points-left").textContent = state.points;
  document.querySelector("#trust").textContent = `${state.trust}%`;
  document.querySelector("#pressure").textContent = state.infected.size >= 4 ? "Severe" : state.exposed.size >= 2 ? "High" : "Rising";

  document.querySelectorAll(".region").forEach((shape) => {
    const id = shape.dataset.id;
    shape.classList.toggle("selected", state.selected === id);
    shape.classList.toggle("infected", state.infected.has(id));
    shape.classList.toggle("exposed", state.exposed.has(id));
    shape.classList.toggle("quarantined", state.quarantined.has(id));
    shape.setAttribute("aria-label", `${regionLookup[id].name}, ${regionStatus(id)}`);
  });

  document.querySelectorAll(".port").forEach((port) => {
    port.classList.toggle("closed", state.closedPorts.has(port.dataset.id));
  });

  routeLayer.querySelectorAll("path").forEach((route) => {
    route.classList.toggle("closed", state.closedRoads.has(route.dataset.route));
  });

  renderSelected();
}

function renderSelected() {
  const selected = state.selected ? regionLookup[state.selected] : null;
  const quarantineBtn = document.querySelector("#quarantine-btn");
  const cordonBtn = document.querySelector("#cordon-btn");
  const portBtn = document.querySelector("#port-btn");

  if (!selected) {
    document.querySelector("#selected-label").textContent = "Select a region";
    document.querySelector("#selected-name").textContent = "No region selected";
    document.querySelector("#selected-detail").textContent = "Click a colony on the map to inspect infection, ports, and quarantine status.";
    quarantineBtn.disabled = true;
    cordonBtn.disabled = true;
    portBtn.disabled = true;
    return;
  }

  const closedRoads = selected.neighbors.filter((neighbor) => isClosedBetween(selected.id, neighbor)).length;
  document.querySelector("#selected-label").textContent = selected.group;
  document.querySelector("#selected-name").textContent = selected.name;
  document.querySelector("#selected-detail").textContent =
    `${regionStatus(selected.id)}. ${closedRoads} of ${selected.neighbors.length} road links closed. ` +
    `${selected.port ? state.closedPorts.has(selected.id) ? "Port closed." : "Port open." : "No major port action available."}`;

  quarantineBtn.disabled = state.gameOver || state.points < 2 || state.quarantined.has(selected.id);
  cordonBtn.disabled = state.gameOver || state.points < 2 || selected.neighbors.every((neighbor) => isClosedBetween(selected.id, neighbor));
  portBtn.disabled = state.gameOver || state.points < 1 || !selected.port || state.closedPorts.has(selected.id);
}

document.querySelector("#quarantine-btn").addEventListener("click", quarantineSelected);
document.querySelector("#cordon-btn").addEventListener("click", cordonSelected);
document.querySelector("#port-btn").addEventListener("click", closePortSelected);
document.querySelector("#next-year-btn").addEventListener("click", advanceYear);
document.querySelector("#reset-btn").addEventListener("click", resetGame);
document.querySelector("#modal-reset-btn").addEventListener("click", resetGame);

buildBoard();
resetGame();
