import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getDatabase, ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4OFajtU-bKi7wuN5B1N_1x71hDo4nf8U",
  authDomain: "alarmaswof.firebaseapp.com",
  databaseURL: "https://alarmaswof-default-rtdb.firebaseio.com",
  projectId: "alarmaswof",
  storageBucket: "alarmaswof.appspot.com",
  messagingSenderId: "xxx",
  appId: "1:xxx:web:xxx"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");

const btnProgramar = document.getElementById("btnProgramar");
const tbody = document.getElementById("tbody");
const formSection = document.getElementById("formSection");

let codigoDetectado = null;
let editarPos = null;

loginButton.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  signInWithEmailAndPassword(auth, email, password)
    .catch(err => alert("Error de autenticación"));
});

onAuthStateChanged(auth, user => {
  if (user) {
    loginSection.style.display = "none";
    mainSection.style.display = "block";
    cargarTransmisores();
  } else {
    loginSection.style.display = "block";
    mainSection.style.display = "none";
  }
});

function cargarTransmisores() {
  const transmisoresRef = ref(db, "/dispositivos/dispositivo01/transmisores");
  get(transmisoresRef).then(snapshot => {
    tbody.innerHTML = "";
    if (snapshot.exists()) {
      const arr = snapshot.val();
      arr.forEach((t, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${t.nombre}</td>
          <td>${t.direccion}</td>
          <td>${t.idWeb}</td>
          <td>
            <button onclick="editarTransmisor(${index})">Editar</button>
            <button onclick="borrarTransmisor(${index})">Borrar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  });
}

window.editarTransmisor = function(pos) {
  const transmisoresRef = ref(db, "/dispositivos/dispositivo01/transmisores");
  get(transmisoresRef).then(snapshot => {
    if (!snapshot.exists()) return alert("Transmisor no encontrado");
    const arr = snapshot.val();
    const t = arr[pos];
    formSection.style.display = "block";
    document.getElementById("codigo-detectado").textContent = t.codigo;
    document.getElementById("input-nombre").value = t.nombre;
    document.getElementById("input-direccion").value = t.direccion;
    document.getElementById("input-idweb").value = t.idWeb;
    codigoDetectado = t.codigo;
    editarPos = pos;
  });
};

window.borrarTransmisor = function(pos) {
  const transmisoresRef = ref(db, "/dispositivos/dispositivo01/transmisores");
  get(transmisoresRef).then(snapshot => {
    let arr = snapshot.val();
    arr.splice(pos, 1);
    set(transmisoresRef, arr).then(() => cargarTransmisores());
  });
};

window.guardarTransmisor = function() {
  const nombre = document.getElementById("input-nombre").value.trim();
  const direccion = document.getElementById("input-direccion").value.trim();
  const idWeb = document.getElementById("input-idweb").value.trim();

  if (!nombre || !direccion || !idWeb || !codigoDetectado) {
    return alert("Completa todos los campos y espera la detección del código RF.");
  }

  const transmisoresRef = ref(db, "/dispositivos/dispositivo01/transmisores");
  get(transmisoresRef).then(snapshot => {
    let arr = snapshot.exists() ? snapshot.val() : [];
    const datos = { codigo: codigoDetectado, nombre, direccion, idWeb };
    if (editarPos !== null) arr[editarPos] = datos;
    else arr.push(datos);
    set(transmisoresRef, arr).then(() => {
      formSection.style.display = "none";
      codigoDetectado = null;
      editarPos = null;
      cargarTransmisores();
    });
  });
};

btnProgramar.addEventListener("click", () => {
  alert("Presione el botón del transmisor ahora...");
  set(ref(db, "/dispositivos/dispositivo01/modoEscucha"), true);
});

onValue(ref(db, "/dispositivos/dispositivo01/codigoCapturado"), (snapshot) => {
  const val = snapshot.val();
  if (val && val !== 0) {
    alert("Código detectado: " + val);
    codigoDetectado = val;
    document.getElementById("codigo-detectado").textContent = val;
    formSection.style.display = "block";
  }
});
