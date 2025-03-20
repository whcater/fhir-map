import { DataDomain } from '../types/metadata';

export const sampleDataDomains: DataDomain[] = [
  {
    id: 'patient',
    name: '患者信息',
    description: '患者基本信息域',
    logicalDtos: [
      {
        id: 'patient-logic',
        name: '患者逻辑模型',
        description: '患者信息的逻辑模型',
        meta: {
          fields: [
            {
              name: 'id',
              type: 'string',
              description: '患者ID',
              required: true,
              fhir_mapping: {
                path: 'Patient.id',
                type: 'string'
              }
            },
            {
              name: 'name',
              type: 'string',
              description: '患者姓名',
              required: true,
              fhir_mapping: {
                path: 'Patient.name[0].text',
                type: 'string'
              }
            }
          ]
        }
      }
    ],
    thirdPartyDtos: [
      {
        id: 'patient-third-party',
        name: '患者第三方模型',
        description: '患者信息的第三方模型',
        meta: {
          fields: [
            {
              name: 'patientId',
              type: 'string',
              description: '患者ID',
              desc: '患者唯一标识'
            },
            {
              name: 'patientName',
              type: 'string',
              description: '患者姓名',
              desc: '患者姓名'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'medication',
    name: '医嘱信息',
    description: '医嘱信息域',
    logicalDtos: [
      {
        id: 'medication-logic',
        name: '医嘱逻辑模型',
        description: '医嘱信息的逻辑模型',
        meta: {
          fields: [
            {
              name: 'id',
              type: 'string',
              description: '医嘱ID',
              required: true,
              fhir_mapping: {
                path: 'MedicationRequest.id',
                type: 'string'
              }
            },
            {
              name: 'medicationCode',
              type: 'string',
              description: '药品编码',
              required: true,
              fhir_mapping: {
                path: 'MedicationRequest.medicationCodeableConcept.coding[0].code',
                type: 'string'
              }
            }
          ]
        }
      }
    ],
    thirdPartyDtos: [
      {
        id: 'medication-third-party',
        name: '医嘱第三方模型',
        description: '医嘱信息的第三方模型',
        meta: {
          fields: [
            {
              name: 'orderId',
              type: 'string',
              description: '医嘱ID',
              desc: '医嘱唯一标识'
            },
            {
              name: 'drugCode',
              type: 'string',
              description: '药品编码',
              desc: '药品编码'
            }
          ]
        }
      }
    ]
  }
]; 