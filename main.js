// Igual configuración Firebase y login

// Función para cargar transmisores desde array
function cargarTransmisores() {
  const transmisoresRef = ref(db, "/transmisores");
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

// Para editar transmisor usa índice (pos) para acceder al array,
// al guardar deberás leer todo array, modificar índice y hacer set completo
window.editarTransmisor = function(pos) {
  const transmisoresRef = ref(db, "/transmisores");
  get(transmisoresRef).then(snapshot => {
    if (!snapshot.exists()) return alert("Transmisor no encontrado");
    const arr = snapshot.val();
    if (pos < 0 || pos >= arr.length) return alert("Posición inválida");
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

// Guardar transmisor (nuevo o editado)
window.guardarTransmisor = function() {
  const nombre = document.getElementById("input-nombre").value.trim();
  const direccion = document.getElementById("input-direccion").value.trim();
  const idWeb = document.getElementById("input-idweb").value.trim();

  if (!nombre || !direccion || !idWeb) {
    return alert("Todos los campos son obligatorios");
  }

  const nuevosDatos = {
    codigo: Number(codigoDetectado),
    nombre,
    direccion,
    idWeb
  };

  const transmisoresRef = ref(db, "/transmisores");

  if (editarPos !== null) {
    // Editar: obtener array completo, modificar y setear entero
    get(transmisoresRef).then(snapshot => {
      let arr = snapshot.exists() ? snapshot.val() : [];
      arr[editarPos] = nuevosDatos;
      set(transmisoresRef, arr)
        .then(() => {
          alert("Transmisor actualizado correctamente");
          formSection.style.display = "none";
          codigoDetectado = null;
          editarPos = null;
          cargarTransmisores();
        })
        .catch(err => alert("Error al actualizar: " + err.message));
    });
  } else {
    // Nuevo transmisor: agregar al final del array
    get(transmisoresRef).then(snapshot => {
      let arr = snapshot.exists() ? snapshot.val() : [];
      arr.push(nuevosDatos);
      set(transmisoresRef, arr)
        .then(() => {
          alert("Transmisor guardado correctamente");
          formSection.style.display = "none";
          codigoDetectado = null;
          cargarTransmisores();
        })
        .catch(err => alert("Error al guardar: " + err.message));
    });
  }
};

// Borrar transmisor por índice
window.borrarTransmisor = function(pos) {
  if (!confirm("¿Está seguro de borrar este transmisor?")) return;
  const transmisoresRef = ref(db, "/transmisores");
  get(transmisoresRef).then(snapshot => {
    if (!snapshot.exists()) return;
    let arr = snapshot.val();
    if (pos < 0 || pos >= arr.length) return alert("Posición inválida");
    arr.splice(pos, 1);
    set(transmisoresRef, arr)
      .then(() => cargarTransmisores())
      .catch(err => alert("Error al borrar: " + err.message));
  });
};

// Variables globales
let editarPos = null;
