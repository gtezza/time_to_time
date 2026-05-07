import { PaisesService } from './services/paisesService.js';
import { TimeOrchestrator } from './agents/TimeOrchestrator.js';

document.addEventListener('DOMContentLoaded', async () => {
    const today = new Date();
    document.getElementById('fecha-base').value = today.toISOString().split('T')[0];

    const horaBaseSelect = document.getElementById('hora-base');
    for (let i = 0; i < 24; i++) {
        const h = i.toString().padStart(2, '0');
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        horaBaseSelect.appendChild(opt);
    }
    horaBaseSelect.value = "10";

    const selPartner = document.getElementById('sel-partner');
    const selCliente = document.getElementById('sel-cliente');

    // Cargar la base de datos geográfica de países desde Supabase de forma asíncrona
    let activeGeoDatabase = {};
    try {
        activeGeoDatabase = await PaisesService.getGeoDatabase();
    } catch (e) {
        console.error("Error al obtener la base de datos de países de Supabase:", e);
    }

    const paises = Object.keys(activeGeoDatabase).sort();

    function poblarSelect(selectElement, opciones, seleccionado = null) {
        selectElement.innerHTML = '';
        opciones.forEach(op => {
            const opt = document.createElement('option');
            opt.value = op;
            opt.textContent = op;
            if (op === seleccionado) opt.selected = true;
            selectElement.appendChild(opt);
        });
    }

    poblarSelect(selPartner, paises, "España");
    poblarSelect(selCliente, paises, "El Salvador");

    function crearRegionSelect(cardId, pais) {
        const card = document.getElementById(cardId);
        let regionSel = card.querySelector('.sel-region');
        
        const data = activeGeoDatabase[pais];
        if (data && data.requiresRegion) {
            if (!regionSel) {
                regionSel = document.createElement('select');
                regionSel.className = 'glass-input sel-region';
                regionSel.style.width = '100%';
                regionSel.style.marginTop = '10px';
                card.appendChild(regionSel);
                regionSel.addEventListener('change', actualizarTriangulacion);
            }
            const regiones = data.regions ? Object.keys(data.regions) : [];
            poblarSelect(regionSel, regiones, regiones[0]);
        } else {
            if (regionSel) {
                regionSel.remove();
            }
        }
    }

    function actualizarNombrePais(cardId, pais) {
        const card = document.getElementById(cardId);
        const locationEl = card.querySelector('.actor-location');
        if (locationEl) locationEl.textContent = pais;
    }

    function onPaisChange(e) {
        const cardId = e.target.closest('.actor-card').id;
        crearRegionSelect(cardId, e.target.value);
        actualizarNombrePais(cardId, e.target.value);
        actualizarTriangulacion();
    }

    selPartner.addEventListener('change', onPaisChange);
    selCliente.addEventListener('change', onPaisChange);

    crearRegionSelect('card-partner', selPartner.value);
    crearRegionSelect('card-cliente', selCliente.value);
    actualizarNombrePais('card-partner', selPartner.value);
    actualizarNombrePais('card-cliente', selCliente.value);

    function actualizarTriangulacion() {
        const fecha = document.getElementById('fecha-base').value;
        const hora = document.getElementById('hora-base').value;
        const min = document.getElementById('minuto-base').value;

        if (!fecha || !hora || !min) return;

        const timeString = `${hora}:${min}`;

        function getActorData(idBase, role) {
            const card = document.getElementById(`card-${idBase}`);
            const pais = document.getElementById(`sel-${idBase}`).value;
            const regionSel = card.querySelector('.sel-region');
            const region = regionSel ? regionSel.value : null;

            return {
                id: idBase,
                role: role,
                country: pais,
                region: region
            };
        }

        const actors = [
            getActorData('partner', 'Partner'),
            { id: 'central', role: 'Central', country: 'Argentina', region: null },
            getActorData('cliente', 'Cliente')
        ];

        const resultado = TimeOrchestrator.triangulate(fecha, timeString, actors, activeGeoDatabase);

        if (resultado.status === "SUCCESS") {
            const warnBox = document.getElementById('warning-box');
            const btnAgendar = document.getElementById('btn-agendar');

            if (resultado.hasInvalidZones) {
                warnBox.style.display = 'block';
                warnBox.innerHTML = `<strong>❌ Error de Configuración:</strong> Uno o más participantes no tienen zona horaria vinculada en la base de datos.`;
                warnBox.style.background = 'rgba(239, 68, 68, 0.2)';
                warnBox.style.borderColor = '#ef4444';
                warnBox.style.color = '#fecaca';
                
                btnAgendar.disabled = true;
                btnAgendar.style.background = '#4b5563';
                btnAgendar.style.color = '#9ca3af';
                btnAgendar.style.cursor = 'not-allowed';
                btnAgendar.textContent = "No es posible agendar (Falta Zona IANA)";
            } else if (resultado.hasWarnings) {
                warnBox.style.display = 'block';
                warnBox.innerHTML = `<strong>⚠️ Advertencia de Horario Comercial:</strong> El horario proyectado para Argentina (<span id="warn-arg-time"></span>) está fuera del horario laboral (09:00 - 20:00).`;
                warnBox.style.background = 'rgba(245, 158, 11, 0.2)';
                warnBox.style.borderColor = '#f59e0b';
                warnBox.style.color = '#fef3c7';
                
                btnAgendar.disabled = false;
                btnAgendar.style.background = '';
                btnAgendar.style.color = '';
                btnAgendar.style.cursor = '';
                btnAgendar.classList.add('btn-force');
                btnAgendar.textContent = "Forzar Agendamiento (Fuera de Horario)";
            } else {
                warnBox.style.display = 'none';
                btnAgendar.disabled = false;
                btnAgendar.style.background = '';
                btnAgendar.style.color = '';
                btnAgendar.style.cursor = '';
                btnAgendar.classList.remove('btn-force');
                btnAgendar.textContent = "Continuar al Agendamiento";
            }

            resultado.results.forEach(res => {
                document.getElementById(`time-${res.id}`).textContent = res.formattedTime;
                
                let dayStr = "Mismo Día";
                if (res.dayShift && res.dayShift.includes('+1')) dayStr = "+1 Día";
                else if (res.dayShift && res.dayShift.includes('-1')) dayStr = "-1 Día";
                else if (res.dayShift === "Sin Zona") dayStr = "Sin Zona";
                
                document.getElementById(`date-${res.id}`).textContent = dayStr;

                if (res.id === 'central' && res.warning) {
                    document.getElementById('warn-arg-time').textContent = res.formattedTime;
                }
            });
        } else if (resultado.status === "NO_ORIGIN_TIMEZONE") {
            const warnBox = document.getElementById('warning-box');
            const btnAgendar = document.getElementById('btn-agendar');
            
            warnBox.style.display = 'block';
            warnBox.innerHTML = `<strong>❌ Error de Origen:</strong> El partner (origen) no tiene una zona horaria configurada.`;
            warnBox.style.background = 'rgba(239, 68, 68, 0.2)';
            warnBox.style.borderColor = '#ef4444';
            warnBox.style.color = '#fecaca';
            
            btnAgendar.disabled = true;
            btnAgendar.style.background = '#4b5563';
            btnAgendar.style.color = '#9ca3af';
            btnAgendar.style.cursor = 'not-allowed';
            btnAgendar.textContent = "No es posible agendar (Origen sin Zona)";
            
            actors.forEach(actor => {
                document.getElementById(`time-${actor.id}`).textContent = "--:--";
                document.getElementById(`date-${actor.id}`).textContent = "Sin Zona";
            });
        } else {
            console.error("Error en triangulación:", resultado);
        }
    }

    document.getElementById('fecha-base').addEventListener('change', actualizarTriangulacion);
    document.getElementById('hora-base').addEventListener('change', actualizarTriangulacion);
    document.getElementById('minuto-base').addEventListener('change', actualizarTriangulacion);

    actualizarTriangulacion();
});
