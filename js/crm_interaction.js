import { geoDatabase } from '../data/mockDB.js';
import { TimeOrchestrator } from './agents/TimeOrchestrator.js';

document.addEventListener('DOMContentLoaded', () => {
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

    const paises = Object.keys(geoDatabase);

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
        
        if (geoDatabase[pais] && geoDatabase[pais].requiresRegion) {
            if (!regionSel) {
                regionSel = document.createElement('select');
                regionSel.className = 'glass-input sel-region';
                regionSel.style.width = '100%';
                regionSel.style.marginTop = '10px';
                card.appendChild(regionSel);
                regionSel.addEventListener('change', actualizarTriangulacion);
            }
            const regiones = Object.keys(geoDatabase[pais].regions);
            poblarSelect(regionSel, regiones, regiones[0]);
        } else {
            if (regionSel) {
                regionSel.remove();
            }
        }
    }

    function onPaisChange(e) {
        const cardId = e.target.closest('.actor-card').id;
        crearRegionSelect(cardId, e.target.value);
        actualizarTriangulacion();
    }

    selPartner.addEventListener('change', onPaisChange);
    selCliente.addEventListener('change', onPaisChange);

    crearRegionSelect('card-partner', selPartner.value);
    crearRegionSelect('card-cliente', selCliente.value);

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

        const resultado = TimeOrchestrator.triangulate(fecha, timeString, actors);

        if (resultado.status === "SUCCESS") {
            const warnBox = document.getElementById('warning-box');
            const btnAgendar = document.getElementById('btn-agendar');

            if (resultado.hasWarnings) {
                warnBox.style.display = 'block';
                btnAgendar.classList.add('btn-force');
                btnAgendar.textContent = "Forzar Agendamiento (Fuera de Horario)";
            } else {
                warnBox.style.display = 'none';
                btnAgendar.classList.remove('btn-force');
                btnAgendar.textContent = "Continuar al Agendamiento";
            }

            resultado.results.forEach(res => {
                document.getElementById(`time-${res.id}`).textContent = res.formattedTime;
                
                let dayStr = "Mismo Día";
                if (res.dayShift > 0) dayStr = "+1 Día";
                if (res.dayShift < 0) dayStr = "-1 Día";
                
                document.getElementById(`date-${res.id}`).textContent = dayStr;

                if (res.id === 'central' && res.warning) {
                    document.getElementById('warn-arg-time').textContent = res.formattedTime;
                }
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
