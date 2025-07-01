import { Socket } from "socket.io"

type DataGlobal = {
  "mode": 'MANUAL' | 'AUTOMATICO'
  "hydroponicTankShowPointLevel": number
  "hydroponicTankShowPH": number
  "hydroponicTankShowEC": number
  "hydroponicTankShowTEMP": number
  "luminarySetPointIntensity": number
  "luminaryShowPointIntensity": number
  "luminaryState": number
  "oxygenatorSetPointtimeOn": number
  "oxygenatorSetPointtimeOff": number
  "oxygenatorState": number
  "bomb1ShowPointSpeed": number
  "bomb1SetPointSpeed": number
  "bomb1State": number
  "bomb2ShowPointSpeed": number
  "bomb2SetPointSpeed": number
  "bomb2State": number
  "bomb3ShowPointSpeed": number
  "bomb3SetPointSpeed": number
  "bomb3State": number
  "phosphoricAcidShowPointLevel": number
  "nutrientSolutionAShowPointLevel": number
  "nutrientSolutionBShowPointLevel": number
}

type DataEvent = {
  "control-config": (data: 'MANUAL' | 'AUTOMATICO') => void
  "luminary-config": (data: { intensity: number }) => void
  "oxygenator-config": (data: { timeOn: number, timeOff: number }) => void
  "phosphoricAcid-config": (data: { speed: number }) => void
  "nutrientSolutionA-config": (data: { speed: number }) => void
  "nutrientSolutionB-config": (data: { speed: number }) => void
  "luminary-state": (data: { state: 1 | 0 }) => void
  "oxygenator-state": (data: { state: 1 | 0 }) => void
  "phosphoricAcid-state": (data: { state: 1 | 0 }) => void
  "nutrientSolutionA-state": (data: { state: 1 | 0 }) => void
  "nutrientSolutionB-state": (data: { state: 1 | 0 }) => void
  "update-data": (data: DataGlobal) => void
}

type SoketData = Socket<DataEvent>;

export {
  DataGlobal,
  DataEvent,
  SoketData
}