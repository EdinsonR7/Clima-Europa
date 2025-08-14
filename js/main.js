let ciudades = [];
let esCelsius = false;
let pronosticoActual = [];

async function cargarCiudadesDesdeCSV() {
  try {
    
    const response = await fetch('city_coordinates.csv');

    if (!response.ok) {
      throw new Error(`Error al cargar CSV: ${response.status}`);
    }

    const csvText = await response.text();
  
    const lineas = csvText.trim().split('\n');

    for (let i = 1; i < lineas.length; i++) {
      const valores = lineas[i].split(',');

      if (valores.length >= 4) {
        const ciudad = {
          nombre: valores[2].trim(),
          lat: parseFloat(valores[0].trim()),
          lon: parseFloat(valores[1].trim()),
          pais: valores[3].trim()
        };

        if (!isNaN(ciudad.lat) && !isNaN(ciudad.lon) && ciudad.nombre) {
          ciudades.push(ciudad);
        }
      }
    }

    llenarSelectCiudades();

  } catch (error) {
    console.error('Error cargando CSV:', error);
    alert('Error al cargar el archivo de ciudades. Verifique que ciudades.csv esté en la carpeta correcta.');
  }
}

function llenarSelectCiudades() {
  const select = document.getElementById("desplegable");

  select.innerHTML = '<option value="">--Seleccione una ciudad--</option>';

  if (ciudades.length === 0) {
    select.innerHTML += '<option value="">No se pudieron cargar las ciudades</option>';
    return;
  }

  ciudades.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

  ciudades.forEach(ciudad => {
    const option = document.createElement("option");
    option.value = `${ciudad.lat},${ciudad.lon}`;
    option.textContent = `${ciudad.nombre}, ${ciudad.pais}`;
    select.appendChild(option);
  });

}

document.addEventListener('DOMContentLoaded', function () {

  cargarCiudadesDesdeCSV();

  document.getElementById("cambiarEscala").addEventListener("click", () => {
    esCelsius = !esCelsius;
    document.getElementById("cambiarEscala").textContent = esCelsius ? "Cambiar a °F" : "Cambiar a °C";
    mostrarPronostico(pronosticoActual);
  });

  const select = document.getElementById("desplegable");
  select.addEventListener("change", function () {
    const valor = this.value;
    if (!valor) return;

    document.getElementById("pronostico").innerHTML = '<p style="font-size: 2px;"><img src="images/load-36_256.gif" style="width:100px;"/></p>';

    const [lat, lon] = valor.split(",");
    obtenerClima(lat, lon);
  });
});

function formatearFecha(fecha) {
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

function getDescripcion(weather) {
  const weatherMap = {
    "clear": "CLARO",
    "pcloudy": "PARCIALMENTE NUBLADO",
    "mcloudy": "NUBLADO",
    "cloudy": "MUY NUBLADO",
    "humid": "HÚMEDO",
    "lightrain": "LLUVIA LIGERA",
    "oshower": "CHUBASCOS",
    "ishower": "CHUBASCOS AISLADOS",
    "lightsnow": "NIEVE LIGERA",
    "rain": "LLUVIOSO",
    "snow": "NEVADO",
    "rainsnow": "LLUVIA Y NIEVE",
    "ts": "TORMENTA",
    "tsrain": "TORMENTA CON LLUVIA"
  };

  return weatherMap[weather] || "CLARO";
}

function getIcono(desc) {
  const iconos = {
    "CLARO": "images/clear.png",
    "PARCIALMENTE NUBLADO": "images/pcloudy.png",
    "NUBLADO": "images/cloudy.png",
    "MUY NUBLADO": "images/cloudy.png",
    "HÚMEDO": "images/pcloudy.png",
    "LLUVIA LIGERA": "images/rain.png",
    "CHUBASCOS": "images/rain.png",
    "CHUBASCOS AISLADOS": "images/rain.png",
    "NIEVE LIGERA": "images/rain.png",
    "LLUVIOSO": "images/rain.png",
    "NEVADO": "images/rain.png",
    "LLUVIA Y NIEVE": "images/rain.png",
    "TORMENTA": "images/rain.png",
    "TORMENTA CON LLUVIA": "images/rain.png"
  };

  return iconos[desc] || "images/clear.png";
}

function convertirTemp(tempC) {
  return esCelsius ? tempC : (tempC * 9 / 5) + 32;
}

function mostrarPronostico(datos) {
  const contenedor = document.getElementById("pronostico");
  contenedor.innerHTML = "";

  if (!datos || datos.length === 0) {
    contenedor.innerHTML = '<p style="color: white;">No hay datos disponibles</p>';
    return;
  }

  datos.forEach((dia, index) => {
    console.log(`Día ${index}:`, dia);

    const tempMax = convertirTemp(dia.temp2m.max).toFixed(1);
    const tempMin = convertirTemp(dia.temp2m.min).toFixed(1);
    const descripcion = getDescripcion(dia.weather);
    const icono = getIcono(descripcion);

    const fecha = new Date(
      dia.date.toString().substring(0, 4),
      dia.date.toString().substring(4, 6) - 1,
      dia.date.toString().substring(6, 8)
    );

    contenedor.innerHTML += `
      <section class="section-one">
        <article class="card">
          <p style="color:white;font-weight:bold;">${formatearFecha(fecha)}</p>
          <img src="${icono}" alt="${descripcion}">
          <p style="color:white;font-weight:bold;">${descripcion}</p>
          <span>Máxima: ${tempMax}°${esCelsius ? "C" : "F"}</span>
          <span>Mínima: ${tempMin}°${esCelsius ? "C" : "F"}</span>
        </article>
      </section>
    `;
  });
}

function obtenerClima(lat, lon) {
  const url = `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civillight&output=json`;

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (!data.dataseries || data.dataseries.length === 0) {
        throw new Error('No hay datos disponibles para esta ciudad');
      }

      pronosticoActual = data.dataseries.slice(0, 7);
      mostrarPronostico(pronosticoActual);
    })
    .catch(err => {
      console.error('Error al obtener clima:', err);
      document.getElementById("pronostico").innerHTML =
        `<p style="color: red;">Error: ${err.message}. Verifique su conexión e intente de nuevo.</p>`;
    });
}