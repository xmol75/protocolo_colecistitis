document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL DE LA APLICACIÓN ---
    let appState = {};

    // --- DEFINICIÓN DE TODOS LOS PASOS DEL PROTOCOLO ---
    const protocolSteps = [
        {
            id: 'start',
            title: 'Parte 1: Criterios Diagnósticos',
            description: 'Seleccione todos los criterios que cumple el paciente.',
            type: 'checklist',
            questions: [
                { id: 'diag_a1', text: 'Signo de Murphy positivo' },
                { id: 'diag_a2', text: 'Masa/dolor/defensa en hipocondrio derecho' },
                { id: 'diag_b1', text: 'Fiebre' },
                { id: 'diag_b2', text: 'PCR elevada' },
                { id: 'diag_b3', text: 'Leucocitosis' },
                { id: 'diag_c', text: 'Hallazgos de imagen compatibles en ecografía' }
            ],
            next: 'eval_diagnosis'
        },
        {
            id: 'eval_diagnosis',
            type: 'logic',
            action: (state) => {
                const hasA = state.diag_a1 || state.diag_a2;
                const hasB = state.diag_b1 || state.diag_b2 || state.diag_b3;
                const hasC = state.diag_c;
                state.hasCholecystitis = hasA && hasB && hasC;
                return state.hasCholecystitis ? 'severity_grade3' : 'end_no_cholecystitis';
            }
        },
        {
            id: 'severity_grade3',
            title: 'Parte 2: Clasificación de Gravedad (Grado III - Severa)',
            description: '¿El paciente cumple ALGUNO de los siguientes criterios de disfunción orgánica?',
            type: 'checklist',
            questions: [
                { id: 'sev_g3_cardio', text: 'Disfunción cardiovascular (hipotensión con vasopresores)' },
                { id: 'sev_g3_neuro', text: 'Disfunción neurológica (alteración de la conciencia)' },
                { id: 'sev_g3_resp', text: 'Disfunción respiratoria (PaO₂/FiO₂ < 300)' },
                { id: 'sev_g3_renal', text: 'Disfunción renal (oliguria, creatinina > 2.0 mg/dl)' },
                { id: 'sev_g3_hep', text: 'Disfunción hepática (INR > 1.5)' },
                { id: 'sev_g3_hem', text: 'Disfunción hematológica (plaquetas < 100.000/mm³)' }
            ],
            next: 'severity_grade2'
        },
        {
            id: 'severity_grade2',
            title: 'Parte 2: Clasificación de Gravedad (Grado II - Moderada)',
            description: '¿El paciente cumple ALGUNO de los siguientes criterios?',
            type: 'checklist',
            questions: [
                { id: 'sev_g2_leuco', text: 'Leucocitosis > 18.000/mm³' },
                { id: 'sev_g2_mass', text: 'Masa dolorosa palpable en hipocondrio derecho' },
                { id: 'sev_g2_time', text: 'Duración de los síntomas > 72 horas' },
                { id: 'sev_g2_inflam', text: 'Marcada inflamación local (gangrena, enfisema, absceso, peritonitis)' }
            ],
            next: 'eval_severity'
        },
        {
            id: 'eval_severity',
            type: 'logic',
            action: (state) => {
                const isGrade3 = state.sev_g3_cardio || state.sev_g3_neuro || state.sev_g3_resp || state.sev_g3_renal || state.sev_g3_hep || state.sev_g3_hem;
                const isGrade2 = state.sev_g2_leuco || state.sev_g2_mass || state.sev_g2_time || state.sev_g2_inflam;

                if (isGrade3) {
                    state.severity = 3;
                } else if (isGrade2) {
                    state.severity = 2;
                } else {
                    state.severity = 1;
                }
                return state.severity === 1 ? 'surgical_criteria' : 'risk_factors';
            }
        },
        {
            id: 'surgical_criteria',
            title: 'Parte 3: Criterios Quirúrgicos (Solo para Grado Leve)',
            description: 'Evaluar la aptitud del paciente para cirugía de urgencia. ¿Cumple ALGUNO?',
            type: 'checklist',
            questions: [
                { id: 'surg_asa', text: 'Paciente ASA III' },
                { id: 'surg_charlson', text: 'Índice de Charlson > 6' }
            ],
            next: 'risk_factors'
        },
        {
            id: 'risk_factors',
            title: 'Parte 3: Factores de Riesgo de Mala Evolución',
            description: 'Seleccione TODOS los factores de riesgo presentes.',
            type: 'checklist',
            questions: [
                { id: 'risk_blee_hosp', text: 'Estancia hospitalaria > 15 días (últimos 3 meses)' },
                { id: 'risk_blee_socio', text: 'Procedencia de centro sociosanitario' },
                { id: 'risk_blee_uti', text: 'Infección urinaria recurrente' },
                { id: 'risk_blee_obstruct', text: 'Obstrucción biliar' },
                { id: 'risk_blee_cortico', text: 'Tratamiento con corticoides' },
                { id: 'risk_blee_sng', text: 'Sonda nasogástrica o endoscopia terapéutica' },
                { id: 'risk_blee_ceph', text: 'Uso de Cefalosporinas de 3ª gen (últimos 3 meses)' },
                { id: 'risk_blee_amino', text: 'Uso de Aminoglucósidos (últimos 3 meses)' },
                { id: 'risk_blee_quino', text: 'Uso de Quinolonas (últimos 3 meses)' },
                { id: 'risk_blee_carba', text: 'Uso de Carbapenémicos (últimos 3 meses)' },
                { id: 'risk_blee_blact', text: 'Uso de B-lactámicos + inhibidor (últimos 3 meses)' },
                { id: 'risk_sev_shock', text: 'Shock séptico' },
                { id: 'risk_com_immuno', text: 'Inmunodepresión' },
                { id: 'risk_com_malnut', text: 'Malnutrición / Niveles bajos de albúmina' },
                { id: 'risk_com_diabetes', text: 'Diabetes complicada o mal controlada' },
                { id: 'risk_com_renal', text: 'Insuficiencia renal crónica' },
                { id: 'risk_com_epoc', text: 'EPOC grave' },
                { id: 'risk_com_cirrhosis', text: 'Cirrosis hepática' },
                { id: 'risk_com_neoplasia', text: 'Enfermedad neoplásica' },
                { id: 'risk_age', text: 'Edad > 70 años' }
            ],
            next: 'antibiotic_considerations'
        },
        {
            id: 'antibiotic_considerations',
            title: 'Parte 3: Consideraciones Adicionales para Antibióticos',
            description: 'Seleccione las condiciones relevantes para el paciente.',
            type: 'checklist',
            questions: [
                { id: 'atb_allergy', text: 'Alérgico a ß-lactámicos' },
                { id: 'atb_anaerobe', text: 'Cultivo positivo por anaerobios o sospecha clínica' },
                { id: 'atb_fistula', text: 'Fístula, anastomosis bilioentérica o prótesis biliar' },
                { id: 'atb_obesity', text: 'Obesidad mórbida' }
            ],
            next: 'admission_criteria'
        },
        {
            id: 'admission_criteria',
            title: 'Parte 4: Criterios de Ingreso / Valoración Especializada',
            description: 'Seleccione los criterios que cumple el paciente.',
            type: 'checklist',
            questions: [
                { id: 'adm_bile_duct', text: 'Aumento tamaño vía biliar (>8mm o >10mm)' },
                { id: 'adm_lithiasis', text: 'Confirmación de litiasis en vía biliar principal' },
                { id: 'adm_bili_high', text: 'Bilirrubina > 3 mg/dL' },
                { id: 'adm_bili_mid', text: 'Bilirrubina 1.5-3 mg/dL mantenida o en aumento' },
                { id: 'adm_ggt', text: 'GGT, FA, AST/ALT > 1.5 veces lo normal' },
                { id: 'adm_pcc', text: 'Paciente Crónico Complejo (PCC)' },
                { id: 'adm_pca', text: 'Paciente Crónico Avanzado (PCA)' }
            ],
            next: 'final_summary'
        },
        {
            id: 'end_no_cholecystitis',
            type: 'result',
            content: `<h3>Diagnóstico</h3><p>El paciente no cumple los criterios de diagnóstico para colecistitis aguda.</p><p><strong>Recomendación:</strong> Considerar otros diagnósticos diferenciales. Si la sospecha clínica persiste, reevaluar o considerar otras pruebas de imagen.</p>`
        },
        {
            id: 'final_summary',
            type: 'result',
            action: (state) => generateFinalSummary(state)
        }
    ];

    // --- MOTOR DE LA APLICACIÓN ---
    const stepContainer = document.getElementById('step-container');
    const resultContainer = document.getElementById('result-container');
    const stepTitle = document.getElementById('step-title');
    const stepDescription = document.getElementById('step-description');
    const questionArea = document.getElementById('question-area');
    const nextButton = document.getElementById('next-button');

    let currentStepIndex = 0;

    function renderStep(stepIndex) {
        const step = protocolSteps[stepIndex];
        
        // Procesar pasos lógicos automáticamente
        if (step.type === 'logic') {
            const nextStepId = step.action(appState);
            const nextStepIndex = protocolSteps.findIndex(s => s.id === nextStepId);
            renderStep(nextStepIndex);
            return;
        }

        stepContainer.classList.remove('hidden');
        resultContainer.classList.add('hidden');

        // Procesar pasos de resultado final
        if (step.type === 'result') {
            let resultContent = typeof step.content === 'function' ? step.content(appState) : step.content;
            if (step.action) {
                resultContent = step.action(appState);
            }
            resultContainer.innerHTML = resultContent + '<button id="restart-button">Iniciar Nuevo Protocolo</button>';
            stepContainer.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            document.getElementById('restart-button').addEventListener('click', restart);
            return;
        }

        // Renderizar pasos de preguntas
        stepTitle.textContent = step.title;
        stepDescription.textContent = step.description;
        questionArea.innerHTML = '';

        if (step.type === 'checklist') {
            step.questions.forEach(q => {
                const group = document.createElement('div');
                group.className = 'question-group';
                group.innerHTML = `
                    <label>
                        <input type="checkbox" id="${q.id}" name="${q.id}">
                        ${q.text}
                    </label>
                `;
                questionArea.appendChild(group);
            });
        }
        
        currentStepIndex = stepIndex;
    }

    function handleNext() {
        const step = protocolSteps[currentStepIndex];

        // Guardar respuestas
        step.questions.forEach(q => {
            appState[q.id] = document.getElementById(q.id).checked;
        });

        const nextStepIndex = protocolSteps.findIndex(s => s.id === step.next);
        renderStep(nextStepIndex);
    }

    function restart() {
        appState = {};
        renderStep(0);
    }

    function generateFinalSummary(state) {
        // 1. Diagnóstico y Gravedad
        let summary = `<div class="result-section"><h3>Diagnóstico y Gravedad</h3><p>Colecistitis Aguda <strong>Grado ${state.severity} (${state.severity === 1 ? 'Leve' : state.severity === 2 ? 'Moderada' : 'Severa'})</strong></p></div>`;

        // 2. Plan Terapéutico Principal
        let therapeuticPlan = '';
        if (state.severity === 1) {
            const isSurgicalCandidate = !(state.surg_asa || state.surg_charlson);
            therapeuticPlan = isSurgicalCandidate 
                ? 'Colecistectomía laparoscópica temprana + Tratamiento antibiótico.'
                : 'Tratamiento antibiótico. Cirugía no urgente por alto riesgo quirúrgico.';
        } else if (state.severity === 2) {
            therapeuticPlan = 'Ingreso hospitalario para tratamiento antibiótico y de soporte. Considerar colecistectomía temprana o drenaje según evolución.';
        } else { // Grado 3
            therapeuticPlan = 'Manejo en unidad de cuidados intensivos. Soporte de la disfunción orgánica. Drenaje de la vesícula biliar (percutáneo o endoscópico). Tratamiento antibiótico de amplio espectro.';
        }
        summary += `<div class="result-section"><h3>Plan Terapéutico</h3><p>${therapeuticPlan}</p></div>`;

        // 3. Tratamiento Antibiótico
        const hasRiskFactors = Object.keys(state).some(key => key.startsWith('risk_') && state[key]);
        let antibioticPlan = '';
        let metronidazoleNote = '';
        let doseNote = '';

        if (state.atb_allergy) {
            antibioticPlan = state.severity < 3
                ? '<strong>Alérgico a ß-lactámicos (Leve/Moderada):</strong> Aztreonam 2g/8h o Gentamicina 240mg/kg/24h.'
                : '<strong>Alérgico a ß-lactámicos (Grave):</strong> Aztreonam 2g/8h + Metronidazol 500mg/8h. Considerar Amikacina 15mg/kg/24h si riesgo de P. aeruginosa o shock séptico.';
        } else {
            if (state.severity === 1) {
                antibioticPlan = hasRiskFactors 
                    ? '<strong>Con Factores de Riesgo:</strong> Ertapenem 1g/24h.'
                    : '<strong>Sin Factores de Riesgo:</strong> Amoxicilina-clavulánico 2g/8h.';
            } else if (state.severity === 2) {
                antibioticPlan = 'Ertapenem 1g/24h.';
            } else { // Grado 3
                antibioticPlan = hasRiskFactors 
                    ? '<strong>Con Factores de Riesgo:</strong> Meropenem 1g/8h.'
                    : '<strong>Sin Factores de Riesgo:</strong> Piperacilina-tazobactam 4-0.5g/6-8h.';
            }
        }

        if (state.atb_anaerobe || state.atb_fistula) {
            metronidazoleNote = `<li><strong>Añadir Metronidazol 500mg/8h</strong> (obligatorio si hay fístula, anastomosis o prótesis).</li>`;
        }
        if (state.atb_obesity) {
            doseNote = `<li><strong>En Obesidad Mórbida:</strong> Ajustar dosis de Gentamicina/Amikacina usando peso ideal + 40% del exceso de peso.</li>`;
        }

        summary += `<div class="result-section"><h3>Tratamiento Antibiótico</h3><ul><li>${antibioticPlan}</li>${metronidazoleNote}${doseNote}</ul></div>`;

        // 4. Valoraciones Especializadas
        const needsGI = state.adm_bile_duct || state.adm_lithiasis || state.adm_bili_high || state.adm_bili_mid || state.adm_ggt;
        const needsIM = state.adm_pcc || state.adm_pca;
        if (needsGI || needsIM) {
            summary += `<div class="result-section warning"><h3>Alertas y Valoraciones Adicionales</h3><ul>`;
            if (needsGI) {
                summary += `<li><strong>Considerar valoración por Digestología:</strong> Cumple criterios de posible afectación de la vía biliar principal.</li>`;
            }
            if (needsIM) {
                summary += `<li><strong>Considerar valoración por Medicina Interna:</strong> Paciente crónico (PCC/PCA) que puede no ser candidato a cirugía y requerir tratamiento de soporte.</li>`;
            }
            summary += `</ul></div>`;
        }

        return summary;
    }

    nextButton.addEventListener('click', handleNext);
    restart(); // Iniciar la aplicación
});
