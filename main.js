import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getDatabase, ref, get, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4OFajtU-bKi7wuN5B1N_1x71hDo4nf8U",
  authDomain: "alarmaswof.firebaseapp.com",
  databaseURL: "https://alarmaswof-default-rtdb.firebaseio.com",
  projectId: "alarmaswof",
  storageBucket: "alarmaswof.appspot.com",
  messagingSenderId: "xxxx",
  appId: "1:xxxx:web:xxxx"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase(app);

const loginSection = document.getElementById("login-section");
const panelSection = document.getElementById("panel-section");
const formSection = document.getElementById("form-section");
const tbody = document.querySelector("#transmisores-table tbody");

let modoProgramacionActivo = false;
let codigoDetectado = null;
let escuchandoCodigoRef = null;

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginSection.style.display = "none";
      panelSection.style.display = "block";
      cargarTransmisores();
      iniciarEscuchaCodigoDetectado();
    })
    .catch(err => alert("Error al iniciar sesión: " + err.message));
}

function cargarTransmisores() {
  const transmisoresRef = ref(db, "/transmisores");
  get(transmisoresRef).then(snapshot => {
    tbody.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach(childSnap => {
        const t = childSnap.val();
        const key = childSnap.key;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${t.nombre}</td>
          <td>${t.direccion}</td>
          <td>${t.idWeb}</td>
          <td>
            <button onclick="editarTransmisor('${key}')">Editar</button>
            <button onclick="borrarTransmisor('${key}')">Borrar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  });
}

function startProgramming() {
  if (modoProgramacionActivo) return alert("Ya está en modo programación");
  modoProgramacionActivo = true;
  alert("Modo programación activado. Espere a que se detecte el código RF...");

  // Escribir en Firebase que ESP32 debe activar modo escucha RF
  set(ref(db, "/modoEscucha"), true);
}

function iniciarEscuchaCodigoDetectado() {
  // Escuchar nodos que el ESP32 llenará con código capturado
  const codigoRef = ref(db, "/codigoCapturado");
  if (escuchandoCodigoRef) {
    // Remover escucha anterior
    escuchandoCodigoRef();
  }
  escuchandoCodigoRef = onValue(codigoRef, snapshot => {
    const val = snapshot.val();
    if (val && modoProgramacionActivo) {
      codigoDetectado = val;
      mostrarFormularioCodigoDetectado(codigoDetectado);
      modoProgramacionActivo = false;
      // Apagar modo escucha para evitar más detecciones
      set(ref(db, "/modoEscucha"), false);
      // Limpiar código capturado para futura programación
      set(ref(db, "/codigoCapturado"), null);
    }
  });
}

function mostrarFormularioCodigoDetectado(codigo) {
  formSection.style.display = "block";
  document.getElementById("codigo-detectado").textContent = codigo;
}

function cancelarFormulario() {
  formSection.style.display = "none";
  codigoDetectado = null;
}

window.guardarTransmisor = function() {
  const nombre = document.getElementById("input-nombre").value.trim();
  const direccion = document.getElementById("input-direccion").value.trim();
  const idWeb = document.getElementById("input-idweb").value.trim();

  if (!nombre || !direccion || !idWeb) {
    return alert("Todos los campos son obligatorios");
  }

  // Guardar nuevo transmisor con código detectado
  const nuevosDatos = {
    codigo: Number(codigoDetectado),
    nombre,
    direccion,
    idWeb
  };

  // Usamos push para agregar un nuevo transmisor
  push(ref(db, "/transmisores"), nuevosDatos)
    .then(() => {
      alert("Transmisor guardado correctamente");
      formSection.style.display = "none";
      codigoDetectado = null;
      cargarTransmisores();
    })
    .catch(err => alert("Error al guardar transmisor: " + err.message));
};

window.editarTransmisor = function(key) {
  const tRef = ref(db, "/transmisores/" + key);
  get(tRef).then(snapshot => {
    if (!snapshot.exists()) return alert("Transmisor no encontrado");

    const t = snapshot.val();
    formSection.style.display = "block";
    document.getElementById("codigo-detectado").textContent = t.codigo;
    document.getElementById("input-nombre").value = t.nombre;
    document.getElementById("input-direccion").value = t.direccion;
    document.getElementById("input-idweb").value = t.idWeb;

    codigoDetectado = t.codigo;

    // Cambiar botón guardar para actualizar
    window.guardarTransmisor = function() {
      const nombre = document.getElementById("input-nombre").value.trim();
      const direccion = document.getElementById("input-direccion").value.trim();
      const idWeb = document.getElementById("input-idweb").value.trim();
      if (!nombre || !direccion || !idWeb) {
        return alert("Todos los campos son obligatorios");
      }
      const datosActualizados = {
        codigo: codigoDetectado,
        nombre,
        direccion,
        idWeb
      };
      update(tRef, datosActualizados)
        .then(() => {
          alert("Transmisor actualizado correctamente");
          formSection.style.display = "none";
          cargarTransmisores();
          // Restaurar función guardar original para agregar
          window.guardarTransmisor = guardarTransmisorOriginal;
        })
        .catch(err => alert("Error al actualizar: " + err.message));
    };
  });
};

window.borrarTransmisor = function(key) {
  if (!confirm("¿Está seguro de borrar este transmisor?")) return;
  remove(ref(db, "/transmisores/" + key))
    .then(() => cargarTransmisores())
    .catch(err => alert("Error al borrar: " + err.message));
};

let guardarTransmisorOriginal = window.guardarTransmisor;

onAuthStateChanged(auth, user => {
  if (!user) {
    loginSection.style.display = "block";
    panelSection.style.display = "none";
    formSection.style.display = "none";
  }
});
