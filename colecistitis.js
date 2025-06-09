document.addEventListener('DOMContentLoaded', () => {
    let appState = {};
    let history = [];

    const protocolSteps = [
        // --- PARTE 1: DIAGNÓSTICO ---
        {
            id: 'start',
            title: 'Criterios Diagnósticos',
            description: 'Seleccione todos los criterios que cumple el paciente para confirmar la sospecha.',
            type: 'checklist',
            categories: [
                {
                    title: 'Elemento A: Signos Locales de Inflamación',
                    questions: [
                        { id: 'diag_a1', text: 'Signo de Murphy (dolor a la palpación en hipocondrio derecho con apnea)' },
                        { id: 'diag_a2', text: 'Masa/dolor/defensa en hipocondrio derecho' },
                    ]
                },
                {
                    title: 'Elemento B: Signos Sistémicos de Inflamación',
                    questions: [
                        { id: 'diag_b1', text: 'Fiebre' },
                        { id: 'diag_b2', text: 'PCR (Proteína C Reactiva) elevada' },
                        { id: 'diag_b3', text: 'Leucocitosis' },
                    ]
                },
                {
                    title: 'Elemento C: Hallazgos de Imagen',
                    questions: [
                        { id: 'diag_c', text: '¿Existen hallazgos compatibles con inflamación de la vesícula biliar (edema de pared o líquido perivesicular) en la ecografía?' },
                    ]
                }
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
        // --- PARTE 2: GRAVEDAD ---
        {
            id: 'severity_grade3',
            title: 'Clasificación de Gravedad (Severa)',
            description: '¿El paciente cumple ALGUNO de los siguientes criterios de disfunción orgánica (Grado III)?',
            type: 'checklist',
            questions: [
                { id: 'sev_g3_cardio', text: 'Disfunción cardiovascular (hipotensión con vasopresores)' },
                { id: 'sev_g3_neuro', text: 'Disfunción neurológica (alteración de la conciencia)' },
                { id: 'sev_g3_resp', text: 'Disfunción respiratoria (PaO₂/FiO₂ < 300)' },
                { id: 'sev_g3_renal', text: 'Disfunción renal (oliguria, creatinina > 2.0 mg/dl)' },
                { id: 'sev_g3_hep', text: 'Disfunción hepática (INR > 1.5)' },
                { id: 'sev_g3_hem', text: 'Disfunción hematológica (plaquetas < 100.000/mm³)' }
            ],
            next: 'eval_grade3'
        },
        {
            id: 'eval_grade3',
            type: 'logic',
            action: (state) => {
                const isGrade3 = Object.keys(state).some(key => key.startsWith('sev_g3_') && state[key]);
                return isGrade3 ? 'risk_factors' : 'severity_grade2';
            }
        },
        {
            id: 'severity_grade2',
            title: 'Clasificación de Gravedad (Moderada)',
            description: '¿El paciente cumple ALGUNO de los siguientes criterios (Grado II)?',
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
                const isGrade3 = Object.keys(state).some(key => key.startsWith('sev_g3_') && state[key]);
                const isGrade2 = Object.keys(state).some(key => key.startsWith('sev_g2_') && state[key]);
                if (isGrade3) state.severity = 3;
                else if (isGrade2) state.severity = 2;
                else state.severity = 1;
                return state.severity === 1 ? 'surgical_criteria' : 'risk_factors';
            }
        },
        // --- PARTE 3: PLAN TERAPÉUTICO ---
        {
            id: 'surgical_criteria',
            title: 'Criterios Quirúrgicos (Grado Leve)',
            description: 'Evaluar la aptitud del paciente para cirugía de urgencia. ¿Cumple ALGUNO de los siguientes criterios?',
            type: 'checklist',
            questions: [
                { id: 'surg_asa', text: 'Paciente ASA III' },
                { id: 'surg_charlson', text: 'Índice de Charlson > 6' }
            ],
            next: 'risk_factors'
        },
        {
            id: 'risk_factors',
            title: 'Factores de Riesgo de Mala Evolución',
            description: 'Seleccione TODOS los factores de riesgo presentes.',
            type: 'checklist',
            categories: [
                {
                    title: 'Relacionados con BLEE',
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
                    ]
                },
                {
                    title: 'Relacionados con Gravedad y Comorbilidad',
                    questions: [
                        { id: 'risk_sev_shock', text: 'Shock séptico' },
                        { id: 'risk_com_immuno', text: 'Inmunodepresión' },
                        { id: 'risk_com_malnut', text: 'Malnutrición / Niveles bajos de albúmina' },
                        { id: 'risk_com_diabetes', text: 'Diabetes complicada o mal controlada' },
                        { id: 'risk_com_renal', text: 'Insuficiencia renal crónica' },
                        { id: 'risk_com_epoc', text: 'EPOC grave' },
                        { id: 'risk_com_cirrhosis', text: 'Cirrosis hepática' },
                        { id: 'risk_com_neoplasia', text: 'Enfermedad neoplásica' },
                        { id: 'risk_age', text: 'Edad > 70 años' }
                    ]
                }
            ],
            next: 'antibiotic_considerations'
        },
        {
            id: 'antibiotic_considerations',
            title: 'Consideraciones para Antibióticos',
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
        // --- PARTE 4: INGRESO ---
        {
            id: 'admission_criteria',
            title: 'Criterios de Ingreso / Valoración Especializada',
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
        // --- FINALES ---
        {
            id: 'end_no_cholecystitis',
            type: 'result',
            content: `<div class="result-section"><h3>Diagnóstico</h3><p>No cumple criterios para sospecha clínica de colecistitis aguda.</p><p><strong>Recomendación:</strong> Considerar otros diagnósticos. Si la sospecha clínica persiste, reevaluar o considerar otras pruebas.</p></div>`
        },
        {
            id: 'final_summary',
            type: 'result',
            action: (state) => generateFinalSummary(state)
        }
    ];

    const stepContainer = document.getElementById('step-container');
    const resultContainer = document.getElementById('result-container');
    const stepTitle = document.getElementById('step-title');
    const stepDescription = document.getElementById('step-description');
    const questionArea = document.getElementById('question-area');
    const nextButton = document.getElementById('next-button');
    const backButton = document.getElementById('back-button');

    let currentStepIndex = 0;

    function renderStep(stepIndex) {
        history.push(currentStepIndex);
        currentStepIndex = stepIndex;

        const step = protocolSteps[currentStepIndex];

        if (step.type === 'logic') {
            const nextStepId = step.action(appState);
            const nextStepIndex = protocolSteps.findIndex(s => s.id === nextStepId);
            renderStep(nextStepIndex);
            return;
        }

        stepContainer.classList.remove('hidden');
        resultContainer.classList.add('hidden');
        backButton.classList.toggle('hidden', history.length <= 1);

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

        stepTitle.textContent = step.title;
        stepDescription.innerHTML = step.description;
        questionArea.innerHTML = '';

        if (step.categories) {
            step.categories.forEach(cat => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'question-category';
                categoryDiv.innerHTML = `<h3>${cat.title}</h3>`;
                cat.questions.forEach(q => renderQuestion(q, categoryDiv));
                questionArea.appendChild(categoryDiv);
            });
        } else {
            step.questions.forEach(q => renderQuestion(q, questionArea));
        }
    }

    function renderQuestion(q, container) {
        const group = document.createElement('div');
        group.className = 'question-group';
        const isChecked = appState[q.id] ? 'checked' : '';
        group.innerHTML = `
            <label>
                <input type="checkbox" id="${q.id}" name="${q.id}" ${isChecked}>
                ${q.text}
            </label>
        `;
        container.appendChild(group);
    }

    function handleNext() {
        const step = protocolSteps[currentStepIndex];
        const questions = step.categories ? step.categories.flatMap(c => c.questions) : step.questions;
        questions.forEach(q => {
            appState[q.id] = document.getElementById(q.id).checked;
        });

        const nextStepIndex = protocolSteps.findIndex(s => s.id === step.next);
        renderStep(nextStepIndex);
    }
    
    function handleBack() {
        if (history.length > 1) {
            currentStepIndex = history.pop();
            const prevStepIndex = history[history.length-1];
            history.pop(); // Pop again to avoid loop
            renderStep(prevStepIndex);
        }
    }

    function restart() {
        appState = {};
        history = [];
        renderStep(0);
    }

    function generateFinalSummary(state) {
        eval_severity.action(state); // Ensure severity is calculated
        
        let summary = `<div class="result-section"><h3>Diagnóstico y Gravedad</h3><p>Colecistitis Aguda <strong>Grado ${state.severity} (${state.severity === 1 ? 'Leve' : state.severity === 2 ? 'Moderada' : 'Severa'})</strong></p></div>`;

        let therapeuticPlan = '';
        if (state.severity === 1) {
            const isSurgicalCandidate = !(state.surg_asa || state.surg_charlson);
            therapeuticPlan = isSurgicalCandidate ? 'Colecistectomía laparoscópica temprana + Tratamiento antibiótico.' : 'Tratamiento antibiótico. Cirugía no urgente por alto riesgo quirúrgico.';
        } else if (state.severity === 2) {
            therapeuticPlan = 'Ingreso hospitalario para tratamiento antibiótico y de soporte. Considerar colecistectomía temprana o drenaje según evolución.';
        } else {
            therapeuticPlan = 'Manejo en unidad de cuidados intensivos. Soporte de la disfunción orgánica. Drenaje de la vesícula biliar. Tratamiento antibiótico de amplio espectro.';
        }
        summary += `<div class="result-section"><h3>Plan Terapéutico</h3><p>${therapeuticPlan}</p></div>`;

        const hasRiskFactors = Object.keys(state).some(key => key.startsWith('risk_') && state[key]);
        let antibioticPlan = '';
        let metronidazoleNote = '';
        let doseNote = '';
        let usesAminoglycoside = false;

        if (state.atb_allergy) {
            usesAminoglycoside = true;
            antibioticPlan = state.severity < 3 ? '<strong>Alérgico a ß-lactámicos (Leve/Moderada):</strong> Aztreonam 2g/8h o Gentamicina 240mg/kg/24h.' : '<strong>Alérgico a ß-lactámicos (Grave):</strong> Aztreonam 2g/8h + Metronidazol 500mg/8h. Considerar Amikacina 15mg/kg/24h si riesgo de P. aeruginosa o shock séptico.';
        } else {
            if (state.severity === 1) antibioticPlan = hasRiskFactors ? '<strong>Con Factores de Riesgo:</strong> Ertapenem 1g/24h.' : '<strong>Sin Factores de Riesgo:</strong> Amoxicilina-clavulánico 2g/8h.';
            else if (state.severity === 2) antibioticPlan = 'Ertapenem 1g/24h.';
            else antibioticPlan = hasRiskFactors ? '<strong>Con Factores de Riesgo:</strong> Meropenem 1g/8h.' : '<strong>Sin Factores de Riesgo:</strong> Piperacilina-tazobactam 4-0.5g/6-8h.';
        }

        if (state.atb_anaerobe || state.atb_fistula) {
            metronidazoleNote = `<li><strong>Añadir Metronidazol 500mg/8h</strong> (obligatorio si hay fístula, anastomosis o prótesis).</li>`;
        }
        if (state.atb_obesity && usesAminoglycoside) {
            doseNote = `<li><strong>En Obesidad Mórbida:</strong> Ajustar dosis de Gentamicina/Amikacina usando peso ideal + 40% del exceso de peso.</li>`;
        }

        summary += `<div class="result-section"><h3>Tratamiento Antibiótico</h3><ul><li>${antibioticPlan}</li>${metronidazoleNote}${doseNote}</ul></div>`;

        const needsGI = state.adm_bile_duct || state.adm_lithiasis || state.adm_bili_high || state.adm_bili_mid || state.adm_ggt;
        const needsIM = state.adm_pcc || state.adm_pca;
        if (needsGI || needsIM) {
            summary += `<div class="result-section warning"><h3>Alertas y Valoraciones Adicionales</h3><ul>`;
            if (needsGI) summary += `<li><strong>Considerar valoración por Digestología:</strong> Cumple criterios de posible afectación de la vía biliar principal.</li>`;
            if (needsIM) summary += `<li><strong>Considerar valoración por Medicina Interna:</strong> Paciente crónico (PCC/PCA) que puede no ser candidato a cirugía y requerir tratamiento de soporte.</li>`;
            summary += `</ul></div>`;
        }

        return summary;
    }
    
    // Find the eval_severity logic step to use it later
    const eval_severity = protocolSteps.find(s => s.id === 'eval_severity');

    nextButton.addEventListener('click', handleNext);
    backButton.addEventListener('click', handleBack);
    restart();
});
