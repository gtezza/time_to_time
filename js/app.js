import { PaisesService } from './services/paisesService.js';
import { TimeOrchestrator } from './agents/TimeOrchestrator.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Referencias
    const form = document.getElementById('triangulatorForm');
    const resultArea = document.getElementById('resultArea');
    const meetingDate = document.getElementById('meetingDate');
    const meetingHour = document.getElementById('meetingHour');
    const meetingMinute = document.getElementById('meetingMinute');

    // Inicializar Fecha por defecto (Hoy)
    const today = new Date();
    meetingDate.value = today.toISOString().split('T')[0];

    // Poblar Selector de Horas
    for (let i = 0; i < 24; i++) {
        const h = i.toString().padStart(2, '0');
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        meetingHour.appendChild(opt);
    }
    // Hora por defecto: 09:00
    meetingHour.value = "09";

    // Cargar la base de datos geográfica de países desde Supabase de forma asíncrona
    let activeGeoDatabase = {};
    try {
        activeGeoDatabase = await PaisesService.getGeoDatabase();
    } catch (e) {
        console.error("Error al obtener la base de datos de países de Supabase:", e);
    }

    // Poblar Países en los 3 selects
    const countrySelects = document.querySelectorAll('.country-select');
    const countries = Object.keys(activeGeoDatabase).sort();

    countrySelects.forEach(select => {
        countries.forEach(country => {
            const opt = document.createElement('option');
            opt.value = country;
            opt.textContent = country;
            select.appendChild(opt);
        });

        // Configurar predeterminados para agilizar la prueba
        const actorId = select.getAttribute('data-actor');
        if (actorId === "1") select.value = "España";
        if (actorId === "2") select.value = "Argentina";
        if (actorId === "3") select.value = "El Salvador";

        // Listeners para manejar regiones
        select.addEventListener('change', (e) => {
            handleCountryChange(e.target, document.getElementById(`regionGroup${actorId}`), document.getElementById(`region${actorId}`));
        });

        // Disparar cambio inicial
        handleCountryChange(select, document.getElementById(`regionGroup${actorId}`), document.getElementById(`region${actorId}`));
    });

    function handleCountryChange(countrySelect, regionGroup, regionSelect) {
        const country = countrySelect.value;
        if (!country) return;

        const data = activeGeoDatabase[country];
        if (!data) return;

        if (data.requiresRegion) {
            regionGroup.classList.remove('hidden');
            regionSelect.required = true;
            regionSelect.innerHTML = '<option value="" disabled selected>Seleccione región...</option>';
            if (data.regions) {
                Object.keys(data.regions).forEach(region => {
                    const opt = document.createElement('option');
                    opt.value = region;
                    opt.textContent = region;
                    regionSelect.appendChild(opt);
                });
            }
        } else {
            regionGroup.classList.add('hidden');
            regionSelect.required = false;
            regionSelect.value = '';
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const dateString = meetingDate.value;
        const timeString = `${meetingHour.value}:${meetingMinute.value}`;

        const actors = [
            { 
                id: 1, role: 'Solicitante (Partner)', 
                country: document.getElementById('country1').value, 
                region: document.getElementById('region1').value || null 
            },
            { 
                id: 2, role: 'Central', 
                country: document.getElementById('country2').value, 
                region: document.getElementById('region2').value || null 
            },
            { 
                id: 3, role: 'Asistente', 
                country: document.getElementById('country3').value, 
                region: document.getElementById('region3').value || null 
            }
        ];

        const result = TimeOrchestrator.triangulate(dateString, timeString, actors, activeGeoDatabase);
        renderResult(result);
    });

    function renderResult(result) {
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = '';
        
        if (result.status === "SUCCESS") {
            const isWarning = result.hasWarnings;
            const hasInvalid = result.hasInvalidZones;
            
            if (hasInvalid) {
                resultArea.className = "triangulation-result status-indicator error";
            } else {
                resultArea.className = `triangulation-result status-indicator ${isWarning ? 'warning' : 'success'}`;
            }
            
            let titleText = '✅ Horario Óptimo';
            let titleColor = 'var(--secondary-color)';
            if (hasInvalid) {
                titleText = '❌ Zona Horaria No Configurada';
                titleColor = 'var(--error-color)';
            } else if (isWarning) {
                titleText = '⚠️ Horario con Advertencias';
                titleColor = 'var(--warning-color)';
            }

            let html = `<h3 style="margin-top:0; color: ${titleColor};">
                ${titleText}
            </h3>
            <div style="margin-bottom: 15px; color: var(--text-secondary); font-size: 0.9rem;">Proyección para el ${meetingDate.value}</div>`;

            result.results.forEach(actor => {
                const location = actor.region ? `${actor.region} (${actor.country})` : actor.country;
                let warningMsg = '';
                if (actor.warning) {
                    warningMsg = `<div class="time-warning" style="font-size:0.85rem; margin-top:5px;">${actor.warning}</div>`;
                } else if (actor.noTimezone) {
                    warningMsg = `<div class="time-warning" style="font-size:0.85rem; margin-top:5px; color: #ef4444;">Falta vincular zona IANA en la base de datos</div>`;
                }

                let timeColor = 'time-success';
                if (actor.warning) {
                    timeColor = 'time-warning';
                } else if (actor.noTimezone) {
                    timeColor = 'time-error';
                }

                html += `
                    <div class="result-row" style="${actor.noTimezone ? 'border-left: 3px solid #ef4444; padding-left: 8px;' : ''}">
                        <div class="actor-info">
                            <div class="actor-name">${actor.role}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${location}</div>
                            ${warningMsg}
                        </div>
                        <div class="actor-time ${timeColor}" style="${actor.noTimezone ? 'color: #ef4444; font-weight: bold;' : ''}">
                            ${actor.formattedTime} <span style="font-size:0.8rem">${actor.dayShift}</span>
                        </div>
                    </div>
                `;
            });

            if (hasInvalid) {
                html += `<div style="margin-top: 20px; text-align: center;">
                    <button class="btn" disabled style="background:#374151; color:#9ca3af; cursor: not-allowed; width: 100%;">
                        No es posible agendar (Falta vincular Zona IANA)
                    </button>
                </div>`;
            } else if (!isWarning) {
                html += `<div style="margin-top: 20px; text-align: center;"><button class="btn btn-primary" style="width: 100%;">Proceder a Agendar en Calendly</button></div>`;
            } else {
                html += `<div style="margin-top: 20px; text-align: center;"><button class="btn" style="background:#f59e0b; color:#000; width: 100%;">Forzar Agendamiento de Todos Modos</button></div>`;
            }

            resultArea.innerHTML = html;

        } else if (result.status === "NO_ORIGIN_TIMEZONE") {
            resultArea.className = 'triangulation-result status-indicator error';
            resultArea.innerHTML = `<h3 style="margin-top:0; color: var(--error-color);">❌ Origen Sin Zona Horaria</h3>
            <p>${result.message}</p>
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn" disabled style="background:#374151; color:#9ca3af; cursor: not-allowed; width: 100%;">
                    No es posible agendar (Origen sin Zona)
                </button>
            </div>`;
        } else if (result.status === "MISSING_DATA") {
            resultArea.className = 'triangulation-result status-indicator error';
            resultArea.innerHTML = `<h3 style="margin-top:0; color: var(--error-color);">❌ Faltan Datos de Región</h3>
            <p>Se requiere seleccionar la región para los siguientes actores:</p>
            <ul>${result.errors.map(e => `<li>Actor ${e.actorId}</li>`).join('')}</ul>`;
        } else {
            resultArea.className = 'triangulation-result status-indicator error';
            resultArea.innerHTML = `<h3 style="margin-top:0; color: var(--error-color);">❌ Error</h3><p>${result.message || 'Error desconocido'}</p>`;
        }
    }
});
