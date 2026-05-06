import { geoDatabase } from '../data/mockSupabase.js';
import { TimeOrchestrator } from './agents/TimeOrchestrator.js';

document.addEventListener('DOMContentLoaded', () => {
    const originCountrySelect = document.getElementById('originCountry');
    const originRegionGroup = document.getElementById('originRegionGroup');
    const originRegionSelect = document.getElementById('originRegion');

    const destCountrySelect = document.getElementById('destCountry');
    const destRegionGroup = document.getElementById('destRegionGroup');
    const destRegionSelect = document.getElementById('destRegion');

    const originHourSelect = document.getElementById('originHour');
    const originMinuteSelect = document.getElementById('originMinute');

    const form = document.getElementById('meetingForm');
    const resultArea = document.getElementById('resultArea');

    // Poblar Selector de Horas (00 a 23)
    for (let i = 0; i < 24; i++) {
        const h = i.toString().padStart(2, '0');
        const option = document.createElement('option');
        option.value = h;
        option.textContent = h;
        originHourSelect.appendChild(option);
    }

    // Poblar Países
    const countries = Object.keys(geoDatabase).sort();
    countries.forEach(country => {
        const opt1 = document.createElement('option');
        opt1.value = country;
        opt1.textContent = country;
        originCountrySelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = country;
        opt2.textContent = country;
        destCountrySelect.appendChild(opt2);
    });

    const handleCountryChange = (countrySelect, regionGroup, regionSelect) => {
        const country = countrySelect.value;
        if (!country) return;

        const data = geoDatabase[country];
        if (data.requiresRegion) {
            regionGroup.classList.remove('hidden');
            regionSelect.required = true;
            regionSelect.innerHTML = '<option value="" disabled selected>Seleccione la región...</option>';
            Object.keys(data.regions).forEach(region => {
                const opt = document.createElement('option');
                opt.value = region;
                opt.textContent = region;
                regionSelect.appendChild(opt);
            });
        } else {
            regionGroup.classList.add('hidden');
            regionSelect.required = false;
            regionSelect.value = '';
        }
    };

    originCountrySelect.addEventListener('change', () => handleCountryChange(originCountrySelect, originRegionGroup, originRegionSelect));
    destCountrySelect.addEventListener('change', () => handleCountryChange(destCountrySelect, destRegionGroup, destRegionSelect));

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const originCountry = originCountrySelect.value;
        const originRegion = originRegionSelect.value || null;
        
        const destCountry = destCountrySelect.value;
        const destRegion = destRegionSelect.value || null;

        const timeString = `${originHourSelect.value}:${originMinuteSelect.value}`;

        const result = TimeOrchestrator.planMeeting(
            originCountry, 
            originRegion, 
            timeString, 
            destCountry, 
            destRegion
        );

        renderResult(result, destCountry, destRegion);
    });

    function renderResult(result, destCountry, destRegion) {
        resultArea.classList.remove('hidden');
        resultArea.className = 'result-card'; // reset classes
        
        const destName = destRegion ? `${destRegion} (${destCountry})` : destCountry;

        if (result.status === 'SUCCESS') {
            resultArea.classList.add('success');
            resultArea.innerHTML = `
                <h3 class="result-title">✅ Reunión Planificada con Éxito</h3>
                <div class="result-details">
                    <span>Hora en ${destName}: <span class="time-highlight">${result.details.destTime}</span></span>
                    <span>Hora en Argentina: <span class="time-highlight">${result.details.argentinaTime}</span></span>
                </div>
            `;
        } else if (result.status === 'ERROR') {
            resultArea.classList.add('error');
            resultArea.innerHTML = `
                <h3 class="result-title">❌ Horario No Válido</h3>
                <div class="result-details">
                    <span>${result.message}</span>
                    <span>Hora proyectada en Argentina: <span class="time-highlight">${result.details.argentinaTime}</span></span>
                </div>
            `;
        } else if (result.status === 'AMBIGUITY_ORIGIN' || result.status === 'AMBIGUITY_DEST') {
            resultArea.classList.add('error');
            resultArea.innerHTML = `
                <h3 class="result-title">⚠️ Faltan Datos</h3>
                <div class="result-details">
                    <span>Por favor, asegúrese de seleccionar la región/estado correspondiente.</span>
                </div>
            `;
        } else {
            resultArea.classList.add('error');
            resultArea.innerHTML = `
                <h3 class="result-title">⚠️ Error del Sistema</h3>
                <div class="result-details">
                    <span>${result.message || 'Error desconocido'}</span>
                </div>
            `;
        }
    }
});
