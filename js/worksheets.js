/*
 * Worksheet definitions. Every title, field, column and fixed row is taken
 * from the source templates (AuditWorkshop.com free resources). The app
 * renders, saves and exports from these definitions, so adding a field here
 * is all it takes to add it everywhere.
 *
 * Block types:
 *   fields    key/value inputs
 *   text      one long-form textarea, optionally prefilled
 *   checks    a set of checkboxes
 *   radios    a single choice from a set
 *   table     rows the user can add and remove
 *   register  fixed rows (clauses, controls, items) with some editable cells
 *   legend    read-only reference table
 *   matrix    the risk rating matrix
 *   tally     live count of a register column
 *   note      instructions copied from the template
 */
(function () {
  'use strict';

  const opt = (...values) => values.map(v => (typeof v === 'string' ? { value: v, label: v } : v));

  const YN = opt('Y', 'N');
  const HML = opt('H', 'M', 'L');
  const GAP_STATUS = opt(
    { value: 'C', label: 'C · Conforms' },
    { value: 'PC', label: 'PC · Partially conforms' },
    { value: 'NC', label: 'NC · Does not conform' },
    { value: 'N/A', label: 'N/A · Not applicable' }
  );
  const AUDIT_RESULT = opt(
    { value: 'C', label: 'C · Conforms' },
    { value: 'NC', label: 'NC · Nonconformity' },
    { value: 'OFI', label: 'OFI · Opportunity for improvement' }
  );
  const IMPL_STATUS = opt('Not implemented', 'Partially implemented', 'Implemented', 'Not applicable');

  const versionHistory = {
    id: 'version-history', title: 'Version History',
    example: '<b>1.0</b> · 2026-10-01 · First issue for Stage 1 readiness · J. Okafor (AIMS Manager)',
    blocks: [{
      type: 'table', id: 'versions', rows: 3,
      columns: [
        { id: 'version', label: 'Version', w: 'xs' },
        { id: 'date', label: 'Date', type: 'date', w: 's' },
        { id: 'change', label: 'Description of Change', type: 'textarea', w: 'l' },
        { id: 'author', label: 'Author', w: 'm' }
      ]
    }]
  };

  const signOff = (id, roles, example) => ({
    id, title: 'Approval', example,
    blocks: [{
      type: 'register', id: 'signoff', refLabel: '',
      columns: roles.map((r, i) => ({ id: 'r' + i, label: r })),
      groups: [{ rows: [{ ref: 'Name' }, { ref: 'Signature' }, { ref: 'Date', type: 'date' }] }]
    }]
  });

  /* Annex A controls, shared by the Gap Analysis, SoA and audit checklist */
  const ANNEX_A = [
    { group: 'A.2 · Policies related to AI', items: [
      ['A.2.2', 'AI policy', 'Establish and maintain a documented policy specific to the development or use of AI systems; communicate it within the organization; make it available to relevant interested parties', 'AI policy — document a policy for the development or use of AI systems'],
      ['A.2.3', 'Alignment with other organizational policies', 'Determine how the AI policy intersects with and aligns to other organizational policies; address any conflicts or gaps', 'Alignment with other organizational policies — determine where other policies intersect with AI'],
      ['A.2.4', 'Review of the AI policy', 'Review the AI policy at planned intervals to ensure continuing suitability, adequacy and effectiveness', 'Review of the AI policy — review at planned intervals for continuing suitability']
    ]},
    { group: 'A.3 · Internal organization', items: [
      ['A.3.2', 'AI roles and responsibilities', 'Define, allocate and communicate roles and responsibilities for AI systems throughout their life cycle, including governance, development, deployment and oversight', 'AI roles and responsibilities — define and allocate roles and responsibilities for AI systems'],
      ['A.3.3', 'Reporting of concerns', 'Establish a process for personnel and relevant parties to raise concerns about the organization’s approach to AI at any stage of the AI system life cycle', 'Reporting of concerns — establish a process to report concerns about the organization’s AI role throughout the life cycle']
    ]},
    { group: 'A.4 · Resources for AI systems', items: [
      ['A.4.2', 'Resource documentation', 'Identify and document resources used by or affecting AI systems at relevant life cycle stages', 'Resource documentation — identify and document relevant resources at given life cycle stages'],
      ['A.4.3', 'Data resources', 'Document information about the data resources utilized for the AI system, including data sources, categories and governance', 'Data resources — document information about data resources utilized for the AI system'],
      ['A.4.4', 'Tooling resources', 'Document information about tooling resources used in the AI system life cycle, including algorithms, frameworks, models and software tools', 'Tooling resources — document information about tooling resources (algorithms, models, tools)'],
      ['A.4.5', 'System and computing resources', 'Document the hardware, cloud, edge and computing infrastructure used to develop, train and operate the AI system', 'System and computing resources — document hardware, cloud and edge infrastructure used'],
      ['A.4.6', 'Human resources', 'Document the human competencies required and utilized across the full AI system life cycle, including development, deployment, oversight and evaluation', 'Human resources — document human competencies utilized across the full AI life cycle']
    ]},
    { group: 'A.5 · Assessing impacts of AI systems', items: [
      ['A.5.2', 'AI system impact assessment process', 'Establish, implement and maintain a formal process for assessing the potential impacts of AI systems on individuals, groups of individuals and society', 'AI system impact assessment process — establish a formal, documented impact assessment process'],
      ['A.5.3', 'Documentation of AI system impact assessments', 'Document and retain the results of all AI system impact assessments for a defined period; make results available to relevant interested parties as appropriate', 'Documentation of AI system impact assessments — document and retain results for a defined period'],
      ['A.5.4', 'Assessing AI system impact on individuals or groups', 'Assess the potential consequences of the AI system for individuals and groups, including impacts on rights, fairness, privacy, safety, financial wellbeing and access to services', 'Assessing AI system impact on individuals or groups of individuals — conduct and document assessments'],
      ['A.5.5', 'Assessing societal impacts of AI systems', 'Assess the potential broader societal consequences of the AI system, including impacts on social cohesion, democratic processes, the environment and human rights at a collective level', 'Assessing societal impacts of AI systems — assess and document potential societal consequences']
    ]},
    { group: 'A.6.1 · Management guidance for AI system development', items: [
      ['A.6.1.2', 'Objectives for responsible development of AI system', 'Identify, document and communicate specific objectives for the responsible design and development of AI systems, aligned with the AI policy', 'Objectives for responsible development of AI system — identify and document development objectives'],
      ['A.6.1.3', 'Processes for responsible AI system design and development', 'Establish and implement documented processes that guide responsible design and development practices throughout the AI system life cycle', 'Processes for responsible AI system design and development — establish and implement documented processes']
    ]},
    { group: 'A.6.2 · AI system life cycle', items: [
      ['A.6.2.2', 'AI system requirements and specification', 'Define, specify and document the requirements for new or materially enhanced AI systems prior to development, including functional, performance, safety and ethical requirements', 'AI system requirements and specification — specify and document requirements for new or materially enhanced AI systems'],
      ['A.6.2.3', 'Documentation of AI system design and development', 'Document design and development decisions, rationale and outputs at relevant stages of the AI system life cycle', 'Documentation of AI system design and development — document design and development decisions'],
      ['A.6.2.4', 'AI system verification and validation', 'Define, document and implement verification and validation (V&V) measures and acceptance criteria for each stage of the AI system life cycle', 'AI system verification and validation — define and document V&V measures and criteria'],
      ['A.6.2.5', 'AI system deployment', 'Establish and document a deployment plan; verify that all requirements are met and approvals obtained prior to deployment of the AI system into operation', 'AI system deployment — document a deployment plan; verify requirements are met prior to deployment'],
      ['A.6.2.6', 'AI system operation and monitoring', 'Define elements for the ongoing operation of the AI system, including monitoring processes, performance thresholds, maintenance procedures, updates and support arrangements', 'AI system operation and monitoring — define elements for ongoing operation, monitoring, repairs, updates and support'],
      ['A.6.2.7', 'AI system technical documentation', 'Determine the technical documentation required by relevant categories of interested parties and ensure it is provided in an appropriate and accessible format', 'AI system technical documentation — determine and provide technical documentation to relevant categories of interested parties'],
      ['A.6.2.8', 'AI system recording of event logs', 'Determine at which life cycle phases event log recording shall be enabled; at a minimum, event log recording must be in place when the AI system is in active use', 'AI system recording of event logs — enable event log recording at minimum when the AI system is in active use']
    ]},
    { group: 'A.7 · Data for AI systems', items: [
      ['A.7.2', 'Data for development and enhancement of AI system', 'Define and implement data management processes for data used to develop, train, test and enhance AI systems', 'Data for development and enhancement — define and implement data management processes'],
      ['A.7.3', 'Acquisition of data', 'Document the criteria and processes for acquiring and selecting data used in the AI system, including sources, collection methods and access rights', 'Acquisition of data — document acquisition and selection criteria'],
      ['A.7.4', 'Quality of data for AI systems', 'Define data quality requirements appropriate for each use in the AI system life cycle; ensure that data used meets those requirements; document quality assessments', 'Quality of data for AI systems — define data quality requirements; ensure data used meets them'],
      ['A.7.5', 'Data provenance', 'Establish a process for recording and maintaining the provenance of data throughout the AI system life cycle, including origin, transformations and lineage', 'Data provenance — establish a process for recording provenance of data over the life cycle'],
      ['A.7.6', 'Data preparation', 'Define criteria for selecting and applying data preparation methods (cleaning, labelling, augmentation, anonymization); document the methods applied', 'Data preparation — define criteria for selecting data preparation methods']
    ]},
    { group: 'A.8 · Information for interested parties of AI systems', items: [
      ['A.8.2', 'System documentation and information for users', 'Provide adequate documentation and information to users of the AI system to support safe, effective and responsible use, including capabilities, limitations and intended use guidance', 'System documentation and information for users — provide adequate documentation and information'],
      ['A.8.3', 'External reporting — adverse impact capabilities', 'Establish accessible channels through which relevant interested parties can report adverse impacts, incidents or concerns arising from the AI system', 'External reporting — provide capabilities for interested parties to report adverse impacts'],
      ['A.8.4', 'Communication of incidents', 'Establish and implement a plan for communicating AI system incidents, errors or significant failures to affected users and other relevant parties in a timely manner', 'Communication of incidents — establish a plan for communicating incidents to users'],
      ['A.8.5', 'Information for interested parties', 'Identify and document the organization’s obligations to report information about the AI system to regulators, customers, partners and other relevant interested parties', 'Information for interested parties — document obligations to report information about the AI system']
    ]},
    { group: 'A.9 · Use of AI systems', items: [
      ['A.9.2', 'Processes for responsible use of AI systems', 'Define, document and implement processes that ensure AI systems are used responsibly and in accordance with the AI policy, relevant laws and ethical commitments', 'Processes for responsible use of AI systems — define and document responsible use processes'],
      ['A.9.3', 'Objectives for responsible use of AI system', 'Identify and document specific objectives for the responsible use of AI systems within the organization, aligned with the AI policy', 'Objectives for responsible use of AI system — identify and document responsible use objectives'],
      ['A.9.4', 'Intended use of the AI system', 'Ensure the AI system is consistently used according to its intended purpose, operational documentation and authorized use cases; monitor and address deviations', 'Intended use of the AI system — ensure the system is used according to its intended use and documentation']
    ]},
    { group: 'A.10 · Third-party and customer relationships', items: [
      ['A.10.2', 'Allocating responsibilities', 'Clearly allocate responsibilities for AI system life cycle activities between the organization, AI system partners, suppliers, customers and relevant third parties; document agreements', 'Allocating responsibilities — allocate responsibilities within the AI system life cycle between the organization, partners, suppliers, customers and third parties'],
      ['A.10.3', 'Suppliers', 'Ensure that the usage of supplier-provided AI services, products, data and materials is aligned with the organization’s responsible approach to AI and the AI policy', 'Suppliers — ensure usage of supplier services, products and materials aligns with responsible approach to AI'],
      ['A.10.4', 'Customers', 'Ensure the organization’s responsible approach to AI development and use considers and appropriately addresses the expectations and needs of customers', 'Customers — ensure the responsible approach to AI systems considers customer expectations and needs']
    ]}
  ];

  /* Clause 4–10 requirements (gap analysis wording) and audit questions */
  const CLAUSES = [
    { group: 'Clause 4 · Context of the Organization', items: [
      ['4.1', 'Determine external and internal issues; determine the organization’s role with respect to AI systems (provider, producer, customer, partner, subject, relevant authority)', 'What internal and external issues relevant to the organization’s AI context have been determined? How has the organization identified its role with respect to AI systems (provider, producer, customer, partner, subject, relevant authority)?'],
      ['4.2', 'Determine interested parties relevant to the AIMS and their relevant requirements; identify applicable compliance obligations', 'Who are the relevant interested parties? What are their needs and requirements regarding the AIMS? Which requirements have been identified as compliance obligations?'],
      ['4.3', 'Determine and document the scope of the AIMS; consider the organization’s AI system roles and relevant issues and requirements', 'Has the AIMS scope been documented? What was considered when determining the scope? Is the scope consistent with the organization’s AI system roles?'],
      ['4.4', 'Establish, implement, maintain and continually improve the AIMS including its processes and their interactions', 'How does the organization establish, implement, maintain and continually improve the AIMS and its processes?']
    ]},
    { group: 'Clause 5 · Leadership', items: [
      ['5.1', 'Top management and the governing body demonstrate leadership and commitment; ensure the AI policy and objectives are established and aligned with strategy; promote risk-based thinking', 'How do top management and the governing body demonstrate leadership and commitment to the AIMS? Is the AI policy compatible with the organization’s strategic direction?'],
      ['5.2', 'Establish, implement and maintain an AI policy; it must be documented, communicated and available to interested parties', 'Is there a documented AI policy? Does it include commitments to satisfy applicable requirements and to continual improvement? Is it communicated and available to relevant interested parties?'],
      ['5.3', 'Assign, communicate and document AIMS roles, responsibilities and authorities; report on AIMS performance to top management', 'Have AIMS roles, responsibilities and authorities been assigned, documented and communicated? Is AIMS performance reported to top management?']
    ]},
    { group: 'Clause 6 · Planning', items: [
      ['6.1.1', 'Determine and address risks and opportunities that could affect AIMS suitability, adequacy and effectiveness', 'What risks and opportunities affecting AIMS suitability and effectiveness have been identified? What actions have been planned to address them?'],
      ['6.1.2', 'Establish an AI risk assessment process; assess AI risks including consequences to individuals, groups and societies; produce consistent and repeatable results; retain documented results', 'Is there a documented AI risk assessment process? Does it assess consequences to individuals, groups and societies? Does it produce consistent, valid and comparable results? Have results been retained as documented information?'],
      ['6.1.3', 'Select AI risk treatment options; determine all necessary controls; compare against Annex A to ensure no controls are omitted; produce and maintain the Statement of Applicability with justification for all inclusions and exclusions', 'How were AI risk treatment options selected? Is a Statement of Applicability (SoA) maintained? Does it cover all Annex A controls with justification for inclusion or exclusion? Has management approved the risk treatment plan and accepted residual AI risks?'],
      ['6.1.4', 'Establish a formal AI system impact assessment process; assess potential impacts on individuals, groups and societies throughout the AI system life cycle; retain documented results', 'Has an AI system impact assessment process been established? Does it address potential impacts on individuals, groups and societies? Are results documented and retained? Are they used to inform the AI risk assessment?'],
      ['6.1.5', 'Plan the frequency and triggers for AI risk assessments and AI system impact assessments', 'How are the frequency and triggers for AI risk assessments and AI system impact assessments planned and scheduled?'],
      ['6.2', 'Establish AI objectives consistent with the AI policy; ensure they are measurable, monitored, communicated and updated as appropriate; plan how objectives will be achieved', 'Are AI objectives established and consistent with the AI policy? Are they measurable, monitored and communicated? Is there a documented plan for achieving AI objectives?'],
      ['6.3', 'When changes to the AIMS are planned, determine how they will be carried out and what documented information will result', 'When changes to the AIMS are planned, how is the change process controlled and what documented information results from the change?']
    ]},
    { group: 'Clause 7 · Support', items: [
      ['7.1', 'Determine and provide resources for the establishment, implementation, maintenance and continual improvement of the AIMS', 'What resources have been determined and provided for the AIMS? Is resourcing adequate for the organization’s AI role and the scope of the AIMS?'],
      ['7.2', 'Determine required competencies; ensure personnel are competent; take appropriate action where needed; retain evidence of competence', 'What competency requirements have been determined for AIMS-relevant roles? Is evidence of competency maintained? What actions have been taken where competency gaps exist?'],
      ['7.3', 'Ensure all relevant personnel are aware of the AI policy, AI objectives and their contribution to AIMS effectiveness', 'Are all relevant personnel aware of the AI policy, the AI objectives and how they contribute to AIMS effectiveness?'],
      ['7.4', 'Determine internal and external communications relevant to the AIMS (what, when, with whom, how)', 'How are internal and external communications related to the AIMS managed? What, when and with whom?'],
      ['7.5', 'Maintain and control all documented information required by the standard and determined as necessary for AIMS effectiveness', 'What documented information is maintained for the AIMS? How is it created, updated and controlled? Are access and distribution managed appropriately?']
    ]},
    { group: 'Clause 8 · Operation', items: [
      ['8.1', 'Plan, implement and control processes needed to meet AIMS requirements; implement actions from Clause 6 planning; retain documented information to demonstrate processes were carried out as planned', 'How are AIMS operational processes planned, implemented and controlled? Is documented information retained to demonstrate processes were carried out as planned?'],
      ['8.2', 'Perform AI risk assessments at planned intervals and when significant changes are proposed; retain results as documented information', 'Are AI risk assessments performed at planned intervals and when significant changes are proposed? Are results retained as documented information?'],
      ['8.3', 'Implement the AI risk treatment plan; retain evidence of results', 'Has the AI risk treatment plan been implemented? Is evidence of treatment implementation retained?'],
      ['8.4', 'Perform AI system impact assessments at planned intervals and when significant changes are proposed; retain documented results', 'Are AI system impact assessments performed at planned intervals and when significant changes are proposed? Are results documented and retained?']
    ]},
    { group: 'Clause 9 · Performance Evaluation', items: [
      ['9.1', 'Determine what to monitor, measure, analyse and evaluate; use valid methods; analyse, evaluate and communicate results; retain documented information', 'What is monitored and measured in relation to the AIMS? How are results analysed, evaluated and communicated? Is documented information retained?'],
      ['9.2', 'Establish and implement an internal audit programme covering the full AIMS scope and Annex A controls; retain audit results; address nonconformities', 'Is an internal audit programme established covering the full AIMS scope and Annex A controls? Are auditors selected to ensure objectivity? Are audit results and nonconformities retained and addressed?'],
      ['9.3', 'Management reviews the AIMS at planned intervals using required inputs; retain documented results of management reviews', 'Does management review the AIMS at planned intervals? Does the review address required inputs (audit results, performance, complaints, objectives status, risk treatment effectiveness)? Are results documented and used for improvement?']
    ]},
    { group: 'Clause 10 · Improvement', items: [
      ['10.1', 'Continually improve the suitability, adequacy and effectiveness of the AIMS', 'How does the organization continually improve the suitability, adequacy and effectiveness of the AIMS?'],
      ['10.2', 'When nonconformities occur: react, correct, evaluate root cause, take corrective action, verify effectiveness; retain documented information', 'When nonconformities occur, how are they corrected, root-caused and addressed via corrective action? Is the effectiveness of corrective action verified? Is documented information retained?']
    ]}
  ];

  const AUDIT_ANNEX = [
    ['A.2.2', 'Is an AI policy documented, approved and communicated? Is it specific to AI — not a generic management policy?'],
    ['A.2.4', 'Is the AI policy reviewed at planned intervals? Is evidence of review retained?'],
    ['A.3.2', 'Are AI-specific roles and responsibilities defined, allocated and communicated? Does allocation reflect the organization’s AI system role (provider/producer/customer/partner)?'],
    ['A.4.3', 'Is information about data resources (sources, categories, governance) documented for each AI system?'],
    ['A.4.4', 'Are tooling resources (algorithms, models, frameworks) documented and traceable?'],
    ['A.5.2', 'Is a formal AI system impact assessment process established? Does it cover impacts on individuals, groups and society?'],
    ['A.5.3', 'Are AI system impact assessment results documented and retained? Are results used to inform the AI risk assessment?'],
    ['A.6.2.4', 'Are verification and validation (V&V) criteria defined for the AI system? Is evidence of V&V activities retained?'],
    ['A.6.2.5', 'Is there a documented deployment plan? Have all pre-deployment requirements been verified before the AI system went live?'],
    ['A.6.2.8', 'Is event log recording enabled for AI systems that are in active use? Are log retention periods defined?'],
    ['A.7.4', 'Are data quality requirements defined? Is there evidence that data used in the AI system meets those requirements?'],
    ['A.7.5', 'Is there a process for recording data provenance throughout the AI system life cycle? Are provenance records maintained?'],
    ['A.8.2', 'Is adequate documentation and information provided to users of the AI system, including capabilities, limitations and intended use?'],
    ['A.8.3', 'Are there accessible channels for interested parties to report adverse impacts or concerns about the AI system?'],
    ['A.9.2', 'Are processes for responsible use of AI systems defined, documented and implemented? Is compliance with those processes monitored?'],
    ['A.9.4', 'Is the AI system being used according to its intended use and documentation? Are deviations identified and addressed?'],
    ['A.10.2', 'Are responsibilities within the AI system life cycle allocated between the organization, partners, suppliers and customers? Are allocation agreements documented?'],
    ['A.10.3', 'Is there evidence that supplier-provided AI services and components align with the organization’s responsible approach to AI?']
  ];

  const ORG = '[Organization Name]';

  const WORKSHEETS = [
    /* ------------------------------------------------------------------ */
    {
      id: 'context',
      nav: 'Context and Interested Parties',
      title: 'Context and Interested Parties',
      ref: 'Clause 4.1 · 4.2',
      intro: 'Clause 4.1 asks you to determine the internal and external issues relevant to your purpose. Clause 4.2 asks who your interested parties are and what they need. Complete both tables, then use them to shape your scope, risks and objectives.',
      sections: [
        {
          id: 'issues', ref: '4.1', title: 'Internal and External Issues',
          example: '<b>Issue:</b> EU AI Act obligations for high-risk credit scoring apply from August 2026 · <b>External</b> · <b>Relevance:</b> our loan pre-screening model falls under Annex III, so conformity assessment and logging become mandatory · <b>Risk</b><br><b>Issue:</b> Only one engineer can retrain and monitor the scoring model · <b>Internal</b> · <b>Relevance:</b> model monitoring stops if that person is unavailable · <b>Risk</b>',
          blocks: [{
            type: 'table', id: 'issues', rows: 6,
            columns: [
              { id: 'issue', label: 'Issue', type: 'textarea', w: 'l' },
              { id: 'type', label: 'Internal / External', type: 'select', options: opt('Internal', 'External'), w: 's' },
              { id: 'relevance', label: 'Relevance to the System', type: 'textarea', w: 'l' },
              { id: 'ro', label: 'Risk or Opportunity', type: 'select', options: opt('Risk', 'Opportunity', 'Both'), w: 's' }
            ]
          }]
        },
        {
          id: 'parties', ref: '4.2', title: 'Interested Parties and Their Needs',
          example: '<b>Interested party:</b> Loan applicants · <b>Needs:</b> fair, explainable decisions and a way to contest them · <b>Requirement:</b> GDPR Art. 22; EU AI Act Art. 86 right to explanation · <b>How we address it:</b> adverse-action notice lists the top three reasons; human review on request within 5 working days',
          blocks: [{
            type: 'table', id: 'parties', rows: 6,
            columns: [
              { id: 'party', label: 'Interested Party', w: 'm' },
              { id: 'needs', label: 'Needs and Expectations', type: 'textarea', w: 'l' },
              { id: 'requirement', label: 'Relevant Requirement', type: 'textarea', w: 'm' },
              { id: 'address', label: 'How We Address It', type: 'textarea', w: 'l' }
            ]
          }]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'legal',
      nav: 'Legal and Compliance Obligations',
      title: 'Legal and Compliance Obligations Register',
      ref: 'Compliance obligations',
      intro: 'List your applicable AI, privacy, consumer and sector requirements relevant to your AI systems. For each obligation record what it requires of you, how you comply, the evidence, and when you last checked compliance. Review whenever the law or your activities change.',
      sections: [
        {
          id: 'details', ref: '', title: 'Details',
          example: '<b>Organisation:</b> Northwind Lending Ltd · <b>Prepared by:</b> Compliance Office · <b>Next compliance review:</b> one quarter after the date of this register',
          blocks: [{
            type: 'fields', id: 'details', fields: [
              { id: 'org', label: 'Organisation' },
              { id: 'by', label: 'Prepared By' },
              { id: 'date', label: 'Date', type: 'date' },
              { id: 'next', label: 'Next Compliance Review', type: 'date' }
            ]
          }]
        },
        {
          id: 'obligations', ref: '4.2', title: 'Obligations',
          example: '<b>Obligation:</b> EU AI Act (Reg. 2024/1689) Art. 9 · <b>Requires:</b> a documented risk management system for each high-risk AI system · <b>How we comply:</b> AI Risk Register reviewed quarterly by the AI Risk Committee · <b>Evidence:</b> Risk Register v1.3, Q3 committee minutes · <b>Status:</b> PC · <b>Last checked:</b> 2026-09-30',
          blocks: [{
            type: 'table', id: 'obligations', rows: 7,
            columns: [
              { id: 'source', label: 'Obligation / Source', type: 'textarea', w: 'm' },
              { id: 'requires', label: 'What It Requires', type: 'textarea', w: 'l' },
              { id: 'comply', label: 'How We Comply', type: 'textarea', w: 'l' },
              { id: 'evidence', label: 'Evidence', type: 'textarea', w: 'm' },
              { id: 'status', label: 'Compliance Status', type: 'select', mark: true, options: opt(
                { value: 'C', label: 'C · Compliant' },
                { value: 'PC', label: 'PC · Partially compliant' },
                { value: 'NC', label: 'NC · Not compliant' },
                { value: 'TBD', label: 'TBD · Assessment pending' }
              ), w: 's' },
              { id: 'checked', label: 'Last Checked', type: 'date', w: 's' }
            ]
          }, {
            type: 'tally', of: 'obligations', col: 'status', labels: { C: 'Compliant', PC: 'Partial', NC: 'Not compliant', TBD: 'Pending' }
          }]
        },
        {
          id: 'key', ref: '', title: 'Compliance Status Key',
          blocks: [{
            type: 'legend', head: ['Code', 'Meaning'], marks: true,
            rows: [['C', 'Compliant'], ['PC', 'Partially compliant · action needed'], ['NC', 'Not compliant · corrective action raised'], ['TBD', 'Assessment pending']]
          }]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'policy',
      nav: 'AI Policy',
      title: 'AI Policy',
      ref: 'Clause 5.2',
      intro: 'Artificial Intelligence Management Policy. The policy text below is the template wording, so edit it to fit your organization and replace every ' + ORG + '.',
      sections: [
        {
          id: 'control', ref: '', title: 'Document Control',
          example: '<b>Document number:</b> POL-AI-001 · <b>Version:</b> 1.0 · <b>Approved by:</b> Board Risk Committee · <b>Document owner:</b> Head of AI Governance',
          blocks: [{
            type: 'fields', id: 'control', fields: [
              { id: 'number', label: 'Document Number', default: 'POL-AI-001' },
              { id: 'version', label: 'Version', default: '1.0' },
              { id: 'issue', label: 'Issue Date', type: 'date' },
              { id: 'review', label: 'Review Date', type: 'date' },
              { id: 'approved', label: 'Approved By' },
              { id: 'owner', label: 'Document Owner' }
            ]
          }]
        },
        {
          id: 'purpose', ref: '1', title: 'Purpose',
          example: 'This policy establishes Northwind Lending’s commitment to the responsible development, deployment and use of AI systems, including the credit pre-screening model and the customer service assistant.',
          blocks: [{ type: 'text', id: 'purpose', rows: 4, default: 'This policy establishes ' + ORG + '’s commitment to the responsible development, deployment and use of artificial intelligence (AI) systems. It provides the foundation for the organization’s Artificial Intelligence Management System (AIMS) in accordance with ISO/IEC 42001:2023.' }]
        },
        {
          id: 'scope', ref: '2', title: 'Scope',
          example: 'Name the units, systems and parties covered, for example: “All AI systems used in Retail Lending and Customer Operations, including vendor-hosted models accessed via API.”',
          blocks: [{ type: 'text', id: 'scope', rows: 4, default: 'This policy applies to all AI systems developed, procured, deployed or used by ' + ORG + ', including AI systems operated by third parties on the organization’s behalf. It applies to all employees, contractors, suppliers and other parties involved in the development, deployment and use of AI systems within the organization.' }]
        },
        {
          id: 'role', ref: '3', title: 'Organizational Role in AI',
          example: 'A lender that builds its own scoring model and also buys a chatbot would tick <b>AI Producer</b> and <b>AI Customer / User</b>.',
          blocks: [{
            type: 'checks', id: 'role', label: ORG + ' operates in the following role(s) with respect to AI systems:',
            options: [
              { id: 'provider', label: 'AI Provider', desc: 'develops or makes available AI systems or AI-enabled products and services' },
              { id: 'producer', label: 'AI Producer', desc: 'designs, develops, deploys, operates or evaluates AI systems' },
              { id: 'customer', label: 'AI Customer / User', desc: 'procures and uses AI systems developed by third parties' },
              { id: 'partner', label: 'AI Partner', desc: 'provides components, data or integration services for AI systems' }
            ]
          }]
        },
        {
          id: 'principles', ref: '4', title: 'AI Principles and Commitments',
          example: 'Make each commitment testable. <b>Human oversight:</b> “No credit application is declined by the model alone; every decline is confirmed by a trained underwriter.”',
          blocks: [{
            type: 'register', id: 'principles', refLabel: 'Principle', refWide: true,
            columns: [{ id: 'commitment', label: 'Our Commitment', type: 'textarea' }],
            groups: [{ rows: [
              { ref: 'Human oversight', defaults: { commitment: 'AI systems are designed and used in a manner that maintains appropriate human control and oversight throughout the AI system life cycle.' } },
              { ref: 'Transparency', defaults: { commitment: 'The organization is transparent about the AI systems it develops and uses, including their capabilities, limitations and potential impacts.' } },
              { ref: 'Fairness', defaults: { commitment: 'AI systems are designed, developed and deployed in ways that promote fairness and avoid unlawful discrimination against individuals or groups.' } },
              { ref: 'Privacy and data protection', defaults: { commitment: 'Personal data used in AI systems is handled in compliance with applicable privacy laws and the organization’s data protection policies.' } },
              { ref: 'Safety and security', defaults: { commitment: 'AI systems are tested, monitored and maintained to ensure they operate safely, reliably and securely throughout their operational life.' } },
              { ref: 'Accountability', defaults: { commitment: 'The organization accepts responsibility for the AI systems it develops or deploys, and maintains documented information to demonstrate accountability.' } },
              { ref: 'Sustainability', defaults: { commitment: 'The environmental impact of AI systems, including energy consumption and resource use, is considered throughout the AI system life cycle.' } },
              { ref: 'Continual improvement', defaults: { commitment: 'The organization continually evaluates and improves its approach to responsible AI development and use.' } }
            ]}]
          }]
        },
        {
          id: 'risk', ref: '5', title: 'AI Risk Management',
          example: 'Add your cadence and owner, for example: “The AI Risk Committee reviews the AI Risk Register quarterly and after any material model change.”',
          blocks: [{ type: 'text', id: 'risk', rows: 5, default: ORG + ' maintains a documented AI risk assessment process that identifies and evaluates risks associated with its AI systems, including potential consequences to individuals, groups of individuals and broader society. AI risks are treated in accordance with this policy and the organization’s risk treatment plan. A Statement of Applicability documents the controls selected from Annex A of ISO/IEC 42001:2023 and the justification for each inclusion or exclusion.' }]
        },
        {
          id: 'impact', ref: '6', title: 'AI System Impact Assessment',
          example: 'State when an assessment is mandatory, for example: “Before go-live, annually, and whenever the intended use or training data changes materially.”',
          blocks: [{ type: 'text', id: 'impact', rows: 4, default: 'Before deploying any new AI system, and at planned intervals thereafter, ' + ORG + ' conducts a formal AI system impact assessment to identify and evaluate potential consequences for individuals, groups of individuals and society. Impact assessment results are documented and used to inform AI risk treatment decisions.' }]
        },
        {
          id: 'roles', ref: '7', title: 'Roles and Responsibilities',
          example: 'Name real roles. <b>AIMS Manager / AI Lead:</b> Head of AI Governance · maintains the SoA and runs quarterly risk reviews · accountable for day-to-day AIMS operations.',
          blocks: [{
            type: 'table', id: 'roles',
            columns: [
              { id: 'role', label: 'Role', w: 'm' },
              { id: 'resp', label: 'Responsibilities', type: 'textarea', w: 'l' },
              { id: 'acc', label: 'Accountability', type: 'textarea', w: 'm' }
            ],
            defaults: [
              ['Governing Body', 'Provide oversight of the AIMS; approve the AI policy; review AI risk posture at management review', 'Organizational AI accountability'],
              ['Top Management', 'Demonstrate leadership; ensure the AI policy is communicated; allocate resources for the AIMS', 'AIMS performance'],
              ['AIMS Manager / AI Lead', 'Manage the AIMS; maintain the Statement of Applicability; coordinate AI risk assessments and impact assessments', 'Day-to-day AIMS operations'],
              ['AI Development Teams', 'Design and develop AI systems in accordance with this policy and the AI system life cycle requirements in Annex A.6', 'Technical compliance'],
              ['All Personnel', 'Comply with this policy; report concerns about AI systems; complete required AI awareness training', 'Individual compliance']
            ]
          }]
        },
        {
          id: 'compliance', ref: '8', title: 'Compliance and Enforcement',
          example: 'Name the reporting channel, for example: “Report suspected breaches to ai-governance@northwind.example or through the anonymous Speak Up line.”',
          blocks: [{ type: 'text', id: 'compliance', rows: 3, default: 'Compliance with this policy is mandatory for all in-scope personnel. Failure to comply may result in disciplinary action in accordance with the organization’s human resources policies. Suspected breaches of this policy should be reported to [AIMS Manager / AI Lead].' }]
        },
        {
          id: 'review', ref: '9', title: 'Policy Review',
          example: 'Keep “at least annually” and add your own triggers, such as a new AI regulation, a serious incident or a new AI system category.',
          blocks: [{ type: 'text', id: 'review', rows: 3, default: 'This policy will be reviewed at least annually, or when significant changes occur to the organization’s AI systems, the regulatory environment, or the organization’s strategic direction. Review results will be documented and the policy updated as appropriate.' }]
        },
        {
          id: 'related', ref: '10', title: 'Related Documents',
          example: 'Add document references so an auditor can trace them: <b>AI Risk Register</b> · REG-AI-002 · Records identified AI risks, likelihood, consequence, treatment and residual risk.',
          blocks: [{
            type: 'table', id: 'related',
            columns: [
              { id: 'doc', label: 'Document', w: 'm' },
              { id: 'purpose', label: 'Purpose', type: 'textarea', w: 'l' }
            ],
            defaults: [
              ['Statement of Applicability (SoA)', 'Documents all Annex A controls selected, with justification for inclusion or exclusion'],
              ['AI Risk Register', 'Records identified AI risks, likelihood, consequence, treatment options and residual risk'],
              ['AI System Impact Assessment', 'Documents the formal impact assessment process and results for each AI system'],
              ['AI System Inventory', 'Register of all AI systems in scope of the AIMS'],
              ['Internal Audit Programme', 'Scheduled internal audits of the AIMS against ISO/IEC 42001:2023']
            ]
          }]
        },
        signOff('approval', ['Prepared by', 'Approved by', 'Governing Body'], '<b>Prepared by:</b> J. Okafor, Head of AI Governance · <b>Approved by:</b> M. Ruiz, Chief Risk Officer · <b>Governing Body:</b> Board Risk Committee'),
        versionHistory
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'impact',
      nav: 'AI System Impact Assessment',
      title: 'AI System Impact Assessment',
      ref: 'Clause 6.1.4 · 8.4',
      intro: 'Formal assessment of impacts on individuals, groups and society. Complete a separate assessment for each AI system in scope, export it, then clear the sheet for the next system. Retain completed assessments as documented information. Review when the AI system, its intended use, or the operating context changes significantly.',
      sections: [
        {
          id: 'info', ref: '1', title: 'AI System Information',
          example: '<b>Assessment ID:</b> AIIA-2026-003 · <b>AI system:</b> Loan pre-screening model · <b>Description:</b> gradient-boosted model that ranks consumer loan applications for underwriter review · <b>Version:</b> 2.4.1 · <b>Status:</b> Deployed',
          blocks: [{
            type: 'fields', id: 'info', fields: [
              { id: 'aid', label: 'Assessment ID' },
              { id: 'name', label: 'AI System Name' },
              { id: 'desc', label: 'System Description', type: 'textarea', wide: true },
              { id: 'version', label: 'Version / Release' },
              { id: 'status', label: 'Deployment Status', type: 'select', options: opt('Development', 'Testing', 'Deployed', 'Retired') },
              { id: 'date', label: 'Date of Assessment', type: 'date' },
              { id: 'next', label: 'Next Review Date', type: 'date' },
              { id: 'by', label: 'Assessment Conducted By' },
              { id: 'reviewed', label: 'Reviewed By' }
            ]
          }]
        },
        {
          id: 'context', ref: '2', title: 'Organizational Role and Context',
          example: '<b>Role:</b> Producer · <b>Jurisdictions:</b> Ireland, Germany · <b>Frameworks:</b> EU AI Act (high-risk, Annex III 5(b)), GDPR, Consumer Credit Directive',
          blocks: [
            { type: 'checks', id: 'orgrole', label: 'Organization’s Role (select applicable)', inline: true,
              options: [{ id: 'provider', label: 'Provider' }, { id: 'producer', label: 'Producer' }, { id: 'customer', label: 'Customer' }, { id: 'partner', label: 'Partner' }] },
            { type: 'fields', id: 'context', fields: [
              { id: 'jurisdiction', label: 'Applicable Jurisdiction(s)' },
              { id: 'frameworks', label: 'Regulatory Framework(s)', placeholder: 'e.g. EU AI Act, Privacy Act 1988, GDPR' }
            ]}
          ]
        },
        {
          id: 'use', ref: '3', title: 'Intended Use and Foreseeable Misuse',
          example: '<b>Intended use:</b> rank applications so underwriters see the riskiest first; the model never declines on its own · <b>Foreseeable misuse:</b> staff treating the score as a final decision, or reusing it for collections prioritisation · <b>Affected population:</b> about 40,000 consumer loan applicants a year, including thin-file young adults',
          blocks: [{
            type: 'fields', id: 'use', stacked: true, fields: [
              { id: 'intended', label: 'Intended Use', hint: 'Describe what the AI system is designed to do', type: 'textarea' },
              { id: 'misuse', label: 'Foreseeable Misuse', hint: 'Describe uses outside intended scope that could cause harm', type: 'textarea' },
              { id: 'context', label: 'Specific Technical and Societal Context', type: 'textarea' },
              { id: 'population', label: 'Affected Population(s)', hint: 'Describe groups who may be impacted', type: 'textarea' }
            ]
          }]
        },
        {
          id: 'stakeholders', ref: '4', title: 'Stakeholder and Subject Analysis',
          example: 'For the loan model: direct users <b>Y</b> (underwriters), indirect subjects <b>Y</b> (applicants), vulnerable groups <b>Partial</b> (elderly applicants), third parties <b>N</b>.',
          blocks: [{
            type: 'register', id: 'stakeholders', refLabel: 'Stakeholder Category', refWide: true,
            columns: [
              { id: 'examples', label: 'Examples', readonly: true },
              { id: 'scope', label: 'In Scope (Y/N/Partial)', type: 'select', mark: true, options: opt('Y', 'N', 'Partial'), w: 's' }
            ],
            groups: [{ rows: [
              { ref: 'Direct users', cells: { examples: 'Employees, customers, members of the public who interact with the AI system directly' } },
              { ref: 'Indirect subjects', cells: { examples: 'Individuals whose data is processed or who are affected by AI decisions without direct interaction' } },
              { ref: 'Vulnerable groups', cells: { examples: 'Minors, elderly persons, persons with disabilities, persons from marginalized communities' } },
              { ref: 'Third parties', cells: { examples: 'Suppliers, partners, competitors, regulatory bodies' } },
              { ref: 'Society / Community', cells: { examples: 'Broader societal groups, future generations, environment' } }
            ]}]
          }]
        },
        {
          id: 'categories', ref: '5', title: 'Impact Category Assessment',
          intro: 'For each impact category, assess the likelihood and severity of potential negative impacts, identify existing controls, determine residual risk level, and document required mitigations.',
          example: '<b>Fairness:</b> Likelihood M · Severity H · Residual M · <b>Mitigation:</b> quarterly disparate-impact test across age and postcode bands; retrain if the approval-rate ratio falls below 0.8',
          blocks: [{
            type: 'register', id: 'categories', refLabel: 'Impact Category', refWide: true,
            columns: [
              { id: 'desc', label: 'Potential Impact Description', readonly: true },
              { id: 'l', label: 'Likelihood (H/M/L)', type: 'select', options: HML, w: 'xs' },
              { id: 's', label: 'Severity (H/M/L)', type: 'select', options: HML, w: 'xs' },
              { id: 'residual', label: 'Residual Risk', type: 'select', options: HML, w: 'xs' },
              { id: 'mitigation', label: 'Mitigation Measures', type: 'textarea' }
            ],
            groups: [{ rows: [
              { ref: 'Fairness and non-discrimination', cells: { desc: 'The AI system produces outcomes that unfairly advantage or disadvantage individuals or groups based on protected characteristics' } },
              { ref: 'Privacy and data protection', cells: { desc: 'Personal data is collected, processed or shared beyond what is necessary or authorized, or in ways that breach privacy rights' } },
              { ref: 'Transparency and explainability', cells: { desc: 'Individuals cannot understand or challenge decisions made about them by the AI system' } },
              { ref: 'Safety and physical harm', cells: { desc: 'The AI system produces outputs that directly or indirectly lead to physical harm to individuals' } },
              { ref: 'Psychological and emotional harm', cells: { desc: 'The AI system causes stress, distress, manipulation or psychological harm to affected individuals' } },
              { ref: 'Financial harm', cells: { desc: 'Individuals or groups suffer financial loss, exclusion from services or economic disadvantage' } },
              { ref: 'Access to essential services', cells: { desc: 'The AI system restricts or denies access to healthcare, housing, credit, education or other essential services' } },
              { ref: 'Societal and democratic impact', cells: { desc: 'The AI system undermines social cohesion, democratic processes, public trust or human rights at a broader societal level' } },
              { ref: 'Environmental impact', cells: { desc: 'The AI system’s energy consumption, resource use or operational impact causes environmental harm' } },
              { ref: 'Security and misuse risk', cells: { desc: 'The AI system can be exploited, manipulated or used maliciously to cause harm to individuals or society' } }
            ]}]
          }]
        },
        {
          id: 'overall', ref: '6', title: 'Overall Impact Rating',
          example: '<b>Rating:</b> Medium · <b>Rationale:</b> credit access is affected, but every decline is confirmed by a human and applicants can appeal · <b>Outcome:</b> Conditional approval (see actions)',
          blocks: [{
            type: 'fields', id: 'overall', fields: [
              { id: 'rating', label: 'Overall Risk Rating', type: 'select', options: opt('High', 'Medium', 'Low'), hint: 'Based on aggregate assessment above' },
              { id: 'outcome', label: 'Assessment Outcome', type: 'select', options: opt('Approved to proceed', 'Conditional approval (see actions)', 'Not approved — redesign required') },
              { id: 'rationale', label: 'Rationale', type: 'textarea', wide: true }
            ]
          }]
        },
        {
          id: 'actions', ref: '7', title: 'Required Actions and Mitigations',
          example: '<b>ACT-01</b> · Add age-band disparity check to the monthly model monitoring report · <b>H</b> · Model Risk team · 2026-12-15',
          blocks: [{
            type: 'table', id: 'actions', rows: 5,
            columns: [
              { id: 'aid', label: 'Action ID', w: 'xs' },
              { id: 'desc', label: 'Action Description', type: 'textarea', w: 'l' },
              { id: 'priority', label: 'Priority (H/M/L)', type: 'select', options: HML, w: 'xs' },
              { id: 'owner', label: 'Responsible Party', w: 'm' },
              { id: 'due', label: 'Due Date', type: 'date', w: 's' }
            ]
          }]
        },
        {
          id: 'monitoring', ref: '8', title: 'Monitoring and Review',
          example: 'Add system-specific triggers, for example “drift alert on PSI > 0.2” or “approval rate shifts by more than 5 points in a month”.',
          blocks: [{
            type: 'fields', id: 'monitoring', fields: [
              { id: 'triggers', label: 'Review Trigger Events', type: 'textarea', wide: true, default: 'Material change to AI system; change to intended use; change to operating context; new regulatory requirements; reported adverse incident' },
              { id: 'next', label: 'Next Scheduled Review Date', type: 'date' },
              { id: 'by', label: 'Review Completed By' }
            ]
          }]
        },
        signOff('approval', ['Assessed By', 'Reviewed By', 'Approved By'], '<b>Assessed by:</b> Model Risk analyst · <b>Reviewed by:</b> Data Protection Officer · <b>Approved by:</b> AIMS Manager'),
        versionHistory
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'risk',
      nav: 'AI Risk Register',
      title: 'AI Risk Register',
      ref: 'Clause 6.1.2 · 8.2',
      intro: 'Record each identified AI risk. Assign Likelihood (1 = Rare, 2 = Unlikely, 3 = Possible, 4 = Likely, 5 = Almost Certain) and Consequence (1 = Negligible, 2 = Minor, 3 = Moderate, 4 = Major, 5 = Catastrophic). Risk Score = Likelihood × Consequence, and the score and level are calculated for you. Identify the ‘Risk to’ category, reference the Annex A controls being applied, and update the status as treatment progresses.',
      sections: [
        {
          id: 'details', ref: '', title: 'Details',
          example: '<b>Organization:</b> Northwind Lending Ltd · <b>AI systems in scope:</b> Loan pre-screening model v2.4; Customer service assistant (vendor LLM)',
          blocks: [{
            type: 'fields', id: 'details', fields: [
              { id: 'version', label: 'Version', default: '1.0' },
              { id: 'date', label: 'Date', type: 'date' },
              { id: 'org', label: 'Organization' },
              { id: 'systems', label: 'AI System(s) in Scope' }
            ]
          }]
        },
        {
          id: 'register', ref: '6.1.2', title: 'Risks',
          example: '<b>R-007</b> · Customer service assistant · Assistant gives incorrect repayment figures that customers act on · <b>Individual</b> · L <b>3</b> × C <b>3</b> = <b>9</b> Medium · A.6.2.6, A.8.2, A.9.4 · Head of Customer Ops · In treatment',
          blocks: [{
            type: 'table', id: 'risks', rows: 15, scoring: true,
            columns: [
              { id: 'rid', label: 'Risk ID', w: 'xs' },
              { id: 'system', label: 'AI System / Function', type: 'textarea', w: 'm' },
              { id: 'desc', label: 'Risk Description', type: 'textarea', w: 'l' },
              { id: 'to', label: 'Risk to', type: 'select', options: opt('Individual', 'Group', 'Society', 'Organization'), w: 's' },
              { id: 'l', label: 'Likelihood 1–5', type: 'select', options: opt('1', '2', '3', '4', '5'), w: 'xs' },
              { id: 'c', label: 'Consequence 1–5', type: 'select', options: opt('1', '2', '3', '4', '5'), w: 'xs' },
              { id: 'score', label: 'Risk Score (L × C)', type: 'computed', w: 'xs' },
              { id: 'level', label: 'Risk Level', type: 'computed', w: 's' },
              { id: 'controls', label: 'Annex A Controls', w: 's' },
              { id: 'owner', label: 'Owner', w: 's' },
              { id: 'status', label: 'Status', type: 'select', options: opt('Open', 'In treatment', 'Treated', 'Accepted', 'Closed'), w: 's' }
            ]
          }, {
            type: 'tally', of: 'risks', col: 'level', labels: { Critical: 'Critical', High: 'High', Medium: 'Medium', Low: 'Low' }
          }]
        },
        {
          id: 'matrix', ref: '', title: 'Risk Rating Matrix',
          blocks: [{ type: 'matrix' }]
        },
        {
          id: 'legend', ref: '', title: 'Risk Level Legend',
          blocks: [{
            type: 'legend', head: ['Score Range', 'Risk Level', 'Action Required'], levels: 1,
            rows: [
              ['17–25', 'Critical', 'Immediate action required; escalate to senior management'],
              ['10–16', 'High', 'Senior management attention required; treatment plan in place within 30 days'],
              ['5–9', 'Medium', 'Management responsibility specified; treatment within 60 days'],
              ['1–4', 'Low', 'Manage by routine procedures; monitor periodically']
            ]
          }]
        },
        versionHistory
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'soa',
      nav: 'Statement of Applicability',
      title: 'Statement of Applicability (SoA)',
      ref: 'Clause 6.1.3',
      intro: 'This Statement of Applicability lists all 38 controls from Annex A of ISO/IEC 42001:2023. For each control, indicate whether it is applicable, its current implementation status, and the justification for inclusion or exclusion. All controls must be addressed, and exclusions require documented justification.',
      sections: [
        {
          id: 'details', ref: '', title: 'Details',
          example: '<b>Organization:</b> Northwind Lending Ltd · <b>Approved by:</b> M. Ruiz, Chief Risk Officer',
          blocks: [{
            type: 'fields', id: 'details', fields: [
              { id: 'version', label: 'Version', default: '1.0' },
              { id: 'date', label: 'Date', type: 'date' },
              { id: 'org', label: 'Organization' },
              { id: 'approved', label: 'Approved By' }
            ]
          }]
        },
        {
          id: 'controls', ref: 'Annex A', title: 'Controls',
          example: 'Justification wording from the template: <b>included</b> — addresses identified AI risk (R-003, R-007); <b>excluded</b> — not applicable to the organization’s AI system role; <b>excluded</b> — managed via existing ISO 27001 controls.',
          blocks: [{
            type: 'register', id: 'controls', refLabel: 'Control ID',
            columns: [
              { id: 'title', label: 'Control Title', readonly: true, w: 's' },
              { id: 'desc', label: 'Control Description', readonly: true },
              { id: 'applicable', label: 'Applicable (Y/N)', type: 'select', mark: true, options: YN, w: 'xs' },
              { id: 'impl', label: 'Implementation Status', type: 'select', mark: true, options: IMPL_STATUS, w: 's' },
              { id: 'just', label: 'Justification', type: 'textarea', w: 'm' }
            ],
            groups: ANNEX_A.map(g => ({ title: g.group, rows: g.items.map(i => ({ ref: i[0], cells: { title: i[1], desc: i[2] } })) }))
          }, {
            type: 'tally', of: 'controls', col: 'impl', labels: { 'Implemented': 'Implemented', 'Partially implemented': 'Partial', 'Not implemented': 'Not implemented', 'Not applicable': 'Not applicable' }
          }]
        },
        {
          id: 'legend', ref: '', title: 'Legend · Implementation Status',
          blocks: [{
            type: 'legend', head: ['Status', 'Meaning'], marks: true,
            rows: [
              ['Not implemented', 'Control has been identified as applicable but no implementation has commenced'],
              ['Partially implemented', 'Some but not all elements of the control are in place'],
              ['Implemented', 'Control is fully implemented and evidence is available'],
              ['Not applicable', 'Control does not apply to the organization’s context — justification provided in the SoA table']
            ]
          }]
        },
        signOff('approval', ['Prepared By', 'Reviewed By', 'Approved By'], '<b>Prepared by:</b> AIMS Manager · <b>Reviewed by:</b> Internal Audit · <b>Approved by:</b> Chief Risk Officer'),
        versionHistory
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'objectives',
      nav: 'Objectives and KPI Tracker',
      title: 'Objectives and KPI Tracker',
      ref: 'Clause 6.2',
      intro: 'Clause 6.2 requires objectives that are measurable, monitored and communicated, with a plan to achieve them. Record each objective, its target and indicator, the plan, and track progress through the year.',
      sections: [
        {
          id: 'details', ref: '', title: 'Details',
          example: '<b>Organisation:</b> Northwind Lending Ltd · <b>Period:</b> FY2027 (Jan–Dec) · <b>Owner:</b> Head of AI Governance',
          blocks: [{
            type: 'fields', id: 'details', fields: [
              { id: 'org', label: 'Organisation' },
              { id: 'period', label: 'Period' },
              { id: 'owner', label: 'Owner' }
            ]
          }]
        },
        {
          id: 'objectives', ref: '6.2', title: 'Objectives',
          example: '<b>Objective:</b> every in-scope AI system has a current impact assessment · <b>KPI:</b> % of systems with an assessment under 12 months old · <b>Target:</b> 100% · <b>Actions:</b> assessment calendar; 2 analyst days per system · <b>Responsible:</b> AIMS Manager · <b>Due:</b> 2027-03-31 · <b>Status:</b> On track',
          blocks: [{
            type: 'table', id: 'objectives', rows: 6,
            columns: [
              { id: 'objective', label: 'Objective', type: 'textarea', w: 'l' },
              { id: 'kpi', label: 'Indicator (KPI)', type: 'textarea', w: 'm' },
              { id: 'target', label: 'Target', w: 's' },
              { id: 'actions', label: 'Resources / Actions', type: 'textarea', w: 'l' },
              { id: 'owner', label: 'Responsible', w: 's' },
              { id: 'due', label: 'Due', type: 'date', w: 's' },
              { id: 'status', label: 'Status', type: 'select', mark: true, options: opt('On track', 'At risk', 'Achieved', 'Missed'), w: 's' }
            ]
          }, {
            type: 'tally', of: 'objectives', col: 'status', labels: { 'On track': 'On track', 'At risk': 'At risk', 'Achieved': 'Achieved', 'Missed': 'Missed' }
          }]
        },
        {
          id: 'key', ref: '', title: 'Status Key',
          blocks: [{
            type: 'legend', head: ['Status', 'Meaning'], marks: true,
            rows: [['On track', 'Progressing to target'], ['At risk', 'May miss target · action needed'], ['Achieved', 'Target met'], ['Missed', 'Target not met · review']]
          }]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'gap',
      nav: 'Gap Analysis',
      title: 'Gap Analysis',
      ref: 'Clause 4.1–10.2 · Annex A',
      intro: 'For each clause and Annex A control, record your current conformance status (Conforms / Partially Conforms / Does Not Conform / N/A), the evidence reviewed, any findings identified, and recommended actions. Retain completed assessments as documented information supporting your AIMS implementation.',
      sections: [
        {
          id: 'details', ref: '', title: 'Details',
          example: '<b>Assessment team:</b> AIMS Manager, DPO, Lead ML Engineer · <b>AI systems in scope:</b> Loan pre-screening model; Customer service assistant',
          blocks: [{
            type: 'fields', id: 'details', fields: [
              { id: 'org', label: 'Organization' },
              { id: 'team', label: 'Assessment Team' },
              { id: 'date', label: 'Date of Assessment', type: 'date' },
              { id: 'systems', label: 'AI System(s) in Scope' },
              { id: 'next', label: 'Next Review Date', type: 'date' }
            ]
          }]
        },
        {
          id: 'requirements', ref: '4–10 · A', title: 'Requirements',
          example: '<b>6.1.4</b> · Status <b>PC</b> · <b>Evidence:</b> one draft impact assessment for the loan model; none for the chatbot · <b>Finding:</b> no defined process or trigger for new systems · <b>Action:</b> adopt the impact assessment template and add it to the change gate',
          blocks: [{
            type: 'register', id: 'gap', refLabel: 'Clause',
            columns: [
              { id: 'req', label: 'Requirement', readonly: true },
              { id: 'status', label: 'Status', type: 'select', mark: true, options: GAP_STATUS, w: 's' },
              { id: 'evidence', label: 'Evidence / Notes', type: 'textarea', w: 'm' },
              { id: 'finding', label: 'Finding', type: 'textarea', w: 'm' },
              { id: 'action', label: 'Action Required', type: 'textarea', w: 'm' }
            ],
            groups: CLAUSES.map(g => ({ title: g.group, rows: g.items.map(i => ({ ref: i[0], cells: { req: i[1] } })) }))
              .concat(ANNEX_A.map(g => ({ title: 'Annex ' + g.group, rows: g.items.map(i => ({ ref: i[0], cells: { req: i[3] } })) })))
          }, {
            type: 'tally', of: 'gap', col: 'status', labels: { C: 'Conforms', PC: 'Partial', NC: 'Does not conform', 'N/A': 'N/A' }
          }]
        },
        {
          id: 'legend', ref: '', title: 'Legend',
          blocks: [{
            type: 'legend', head: ['Symbol', 'Label', 'Meaning'], marks: true,
            rows: [
              ['C', 'Conforms', 'Meets the requirement fully'],
              ['PC', 'Partially Conforms', 'Some elements missing or incomplete'],
              ['NC', 'Does Not Conform', 'Requirement not addressed'],
              ['N/A', 'Not Applicable', 'Control not applicable with justification required']
            ]
          }]
        },
        versionHistory
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'audit',
      nav: 'Internal Audit Checklist',
      title: 'Internal Audit Checklist',
      ref: 'Clause 9.2',
      intro: 'For each audit criterion, select the conformance result (C = Conforms, NC = Nonconformity, OFI = Opportunity for Improvement), record the evidence sighted, document any findings, and note recommended actions. Retain completed checklists as documented information per Clause 7.5. Reference ISO 19011:2026 for auditing methodology.',
      sections: [
        {
          id: 'details', ref: '', title: 'Audit Details',
          example: '<b>Audit no.:</b> IA-2026-02 · <b>Auditors:</b> P. Lindqvist (lead), external associate · <b>Auditee:</b> Data Science & Model Risk',
          blocks: [{
            type: 'fields', id: 'details', fields: [
              { id: 'version', label: 'Version', default: '1.0' },
              { id: 'no', label: 'Audit No.' },
              { id: 'auditors', label: 'Auditor(s)' },
              { id: 'auditee', label: 'Auditee / Department' },
              { id: 'date', label: 'Date of Audit', type: 'date' }
            ]
          }]
        },
        {
          id: 'criteria', ref: '4–10 · A', title: 'Audit Criteria',
          example: '<b>A.6.2.8</b> · <b>NC</b> · <b>Evidence sighted:</b> logging config for the scoring API; log store retention set to 14 days · <b>Finding:</b> retention is shorter than the 6 months required by the logging procedure · <b>Action:</b> raise retention to 6 months and add a monitoring check',
          blocks: [{
            type: 'register', id: 'audit', refLabel: 'Clause',
            columns: [
              { id: 'q', label: 'Audit Question / Criterion', readonly: true },
              { id: 'result', label: 'C / NC / OFI', type: 'select', mark: true, options: AUDIT_RESULT, w: 's' },
              { id: 'evidence', label: 'Evidence Sighted', type: 'textarea', w: 'm' },
              { id: 'findings', label: 'Findings', type: 'textarea', w: 'm' },
              { id: 'action', label: 'Recommended Action', type: 'textarea', w: 'm' }
            ],
            groups: CLAUSES.map(g => ({ title: g.group, rows: g.items.map(i => ({ ref: i[0], cells: { q: i[2] } })) }))
              .concat([{ title: 'Annex A · Reference Controls (selected key controls)', rows: AUDIT_ANNEX.map(i => ({ ref: i[0], cells: { q: i[1] } })) }])
          }]
        },
        {
          id: 'summary', ref: '', title: 'Audit Summary',
          example: 'Counts fill in from the checklist above. Use <b>Notes</b> for context, for example “NC-01 and NC-02 both relate to logging; one corrective action raised.”',
          blocks: [{
            type: 'register', id: 'summary', refLabel: 'Category', refWide: true,
            columns: [
              { id: 'count', label: 'Count', type: 'computed', w: 'xs' },
              { id: 'notes', label: 'Notes', type: 'textarea' }
            ],
            groups: [{ rows: [
              { ref: 'Conformities (C)', count: { of: 'audit', col: 'result', value: 'C' } },
              { ref: 'Nonconformities (NC)', count: { of: 'audit', col: 'result', value: 'NC' } },
              { ref: 'Opportunities for Improvement (OFI)', count: { of: 'audit', col: 'result', value: 'OFI' } },
              { ref: 'Items Not Audited / Not Applicable', count: { of: 'audit', col: 'result', value: '' } }
            ]}]
          }]
        },
        {
          id: 'conclusion', ref: '', title: 'Overall Audit Conclusion',
          example: 'With two minor NCs and no systemic failures, a lead auditor would usually select <b>partially conforms</b>.',
          blocks: [
            { type: 'radios', id: 'conclusion', label: 'Audit Conclusion', options: [
              { id: 'conforms', label: 'AIMS conforms to the requirements of ISO/IEC 42001:2023 and the organization’s AIMS requirements' },
              { id: 'partial', label: 'AIMS partially conforms — see nonconformities' },
              { id: 'not', label: 'AIMS does not conform — significant nonconformities identified' }
            ]},
            { type: 'fields', id: 'lead', fields: [{ id: 'lead', label: 'Lead Auditor' }] }
          ]
        },
        signOff('approval', ['Lead Auditor', 'Auditee Representative', 'AIMS Manager'], '<b>Lead auditor:</b> P. Lindqvist · <b>Auditee representative:</b> Head of Data Science · <b>AIMS Manager:</b> J. Okafor'),
        versionHistory
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'readiness',
      nav: 'Certification Readiness',
      title: 'Certification Readiness Checklist',
      ref: 'Stage 1 preparation',
      intro: 'Stage 1 checks that your system is documented and ready for the Stage 2 audit. Work through each item, confirm the evidence exists, and close any gaps before your certification body arrives.',
      sections: [
        {
          id: 'items', ref: '', title: 'Readiness Items',
          example: '<b>8 · Internal audit programme completed</b> · <b>Y</b> · <b>Evidence:</b> IA-2026-02 report, signed 2026-09-12 · <b>Action:</b> close NC-01 before Stage 1',
          blocks: [{
            type: 'register', id: 'readiness', refLabel: '#',
            columns: [
              { id: 'item', label: 'Readiness Item', readonly: true },
              { id: 'inplace', label: 'In Place (Y/N)', type: 'select', mark: true, options: YN, w: 'xs' },
              { id: 'evidence', label: 'Evidence / Reference', type: 'textarea', w: 'm' },
              { id: 'action', label: 'Action', type: 'textarea', w: 'm' }
            ],
            groups: [
              { title: 'Documentation and Planning', rows: [
                { ref: '1', cells: { item: 'Scope of the management system defined and documented' } },
                { ref: '2', cells: { item: 'Policy established and communicated' } },
                { ref: '3', cells: { item: 'Context (4.1) and interested parties (4.2) determined' } },
                { ref: '4', cells: { item: 'Risks, opportunities and objectives documented' } }
              ]},
              { title: 'Operation and Support', rows: [
                { ref: '5', cells: { item: 'Roles, responsibilities and competence records in place' } },
                { ref: '6', cells: { item: 'Required documented information and operational controls established' } },
                { ref: '7', cells: { item: 'Legal and other requirements identified and evaluated' } }
              ]},
              { title: 'Checking the System Works', rows: [
                { ref: '8', cells: { item: 'Internal audit programme completed at least once across all clauses' } },
                { ref: '9', cells: { item: 'Management review held with the required inputs and outputs' } },
                { ref: '10', cells: { item: 'Nonconformities raised, with corrective action underway or closed' } },
                { ref: '11', cells: { item: 'Records demonstrate the system has been operating (typically 2 to 3 months)' } }
              ]}
            ]
          }, {
            type: 'tally', of: 'readiness', col: 'inplace', labels: { Y: 'In place', N: 'Not in place' }
          }]
        }
      ]
    }
  ];

  window.WORKSHEETS = WORKSHEETS;
})();
