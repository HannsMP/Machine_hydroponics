import { Socket, Server } from "socket.io"

type DataController = {
  "IREG_TDS_RAW": number
  "IREG_PH_RAW": number
  "IREG_TEMP_RAW": number
  "IREG_LIGHT_LUX": number
  "IREG_LSL": number
  "IREG_LSH": number
  "COIL_AIR_PUMP": number
  "HREG_LIGHT_PWM": number
  "HREG_MODE": number
  "HREG_LUX_SP": number
  "HREG_AIR_ON_TIME": number
  "HREG_AIR_OFF_TIME": number
  "COIL_BOMBA_0": number
  "COIL_BOMBA_1": number
  "COIL_BOMBA_2": number
  "COIL_BOMBA_3": number
  "HREG_BOMBA_0": number
  "HREG_BOMBA_1": number
  "HREG_BOMBA_2": number
  "HREG_BOMBA_3": number
  "HREG_B1_SP": number
  "HREG_B1_ON_TIME": number
  "HREG_B1_OFF_TIME": number
  "HREG_B2_SP": number
  "HREG_B2_ON_TIME": number
  "HREG_B2_OFF_TIME": number
  "HREG_B3_SP": number
  "HREG_B3_ON_TIME": number
  "HREG_B3_OFF_TIME": number
}

type DataReqMQTT = {
  "control/COIL_BOMBA_0": number
  "control/COIL_BOMBA_1": number
  "control/COIL_BOMBA_2": number
  "control/COIL_BOMBA_3": number
  "control/HREG_BOMBA_0": number
  "control/HREG_BOMBA_1": number
  "control/HREG_BOMBA_2": number
  "control/HREG_BOMBA_3": number
  "control/COIL_AIR_PUMP": number
  "control/HREG_LIGHT_PWM": number
  "control/HREG_MODE": number
  "control/HREG_LUX_SP": number
  "control/HREG_AIR_ON_TIME": number
  "control/HREG_AIR_OFF_TIME": number
  "control/HREG_B1_SP": number
  "control/HREG_B1_ON_TIME": number
  "control/HREG_B1_OFF_TIME": number
  "control/HREG_B2_SP": number
  "control/HREG_B2_ON_TIME": number
  "control/HREG_B2_OFF_TIME": number
  "control/HREG_B3_SP": number
  "control/HREG_B3_ON_TIME": number
  "control/HREG_B3_OFF_TIME": number
  "control/REQ_ALL_DATA": null
}

type DataResMQTT = {
  "control/RES_ALL_DATA": DataController
}

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
  "bomb1SetPointtimeOn": number
  "bomb1SetPointtimeOff": number
  "bomb1State": number
  "bomb2ShowPointSpeed": number
  "bomb2SetPointSpeed": number
  "bomb2SetPointtimeOn": number
  "bomb2SetPointtimeOff": number
  "bomb2State": number
  "bomb3ShowPointSpeed": number
  "bomb3SetPointSpeed": number
  "bomb3SetPointtimeOn": number
  "bomb3SetPointtimeOff": number
  "bomb3State": number
  "phosphoricAcidShowPointLevel": number
  "nutrientSolutionAShowPointLevel": number
  "nutrientSolutionBShowPointLevel": number
}

type control_config = 'MANUAL' | 'AUTOMATICO'
type luminary_config = { intensity: number }
type oxygenator_config = { timeOn: number, timeOff: number }
type phosphoricAcid_config = { timeOn: number, timeOff: number, speed: number }
type nutrientSolutionA_config = { timeOn: number, timeOff: number, speed: number }
type nutrientSolutionB_config = { timeOn: number, timeOff: number, speed: number }
type luminary_state = { state: 1 | 0 }
type oxygenator_state = { state: 1 | 0 }
type phosphoricAcid_state = { state: 1 | 0 }
type nutrientSolutionA_state = { state: 1 | 0 }
type nutrientSolutionB_state = { state: 1 | 0 }
type update_data = DataGlobal

type DataEvent = {
  "control-config": (data: control_config) => void
  "luminary-config": (data: luminary_config) => void
  "oxygenator-config": (data: oxygenator_config) => void
  "phosphoricAcid-config": (data: phosphoricAcid_config) => void
  "nutrientSolutionA-config": (data: nutrientSolutionA_config) => void
  "nutrientSolutionB-config": (data: nutrientSolutionB_config) => void

  "luminary-state": (data: luminary_state) => void
  "oxygenator-state": (data: oxygenator_state) => void
  "phosphoricAcid-state": (data: phosphoricAcid_state) => void
  "nutrientSolutionA-state": (data: nutrientSolutionA_state) => void
  "nutrientSolutionB-state": (data: nutrientSolutionB_state) => void

  "/update-data": (data: update_data) => void
}

type SocketData = Socket<DataEvent>;
type ServerSocketData = Server<SocketData>

export {
  DataGlobal,
  DataEvent,
  DataController,
  DataReqMQTT,
  DataResMQTT,

  control_config,
  luminary_config,
  oxygenator_config,
  phosphoricAcid_config,
  nutrientSolutionA_config,
  nutrientSolutionB_config,
  luminary_state,
  oxygenator_state,
  phosphoricAcid_state,
  nutrientSolutionA_state,
  nutrientSolutionB_state,
  update_data,

  SocketData,
  ServerSocketData
}


/* 

{
  IREG_TDS_RAW: 0,
  IREG_PH_RAW: 34,
  IREG_TEMP_RAW: 2266,
  IREG_LIGHT_LUX: 43,
  IREG_LSL: 0,
  IREG_LSH: 0,
  COIL_AIR_PUMP: 0,
  HREG_LIGHT_PWM: 100,
  HREG_MODE: 0,
  HREG_LUX_SP: 100,
  HREG_AIR_ON_TIME: 180,
  HREG_AIR_OFF_TIME: 3420,
  COIL_BOMBA_0: 0,
  COIL_BOMBA_1: 0,
  COIL_BOMBA_2: 0,
  COIL_BOMBA_3: 0,
  HREG_BOMBA_0: 0,
  HREG_BOMBA_1: 0,
  HREG_BOMBA_2: 0,
  HREG_BOMBA_3: 0,
  HREG_B1_SP: 500,
  HREG_B1_ON_TIME: 10,
  HREG_B1_OFF_TIME: 300,
  HREG_B2_SP: 500,
  HREG_B2_ON_TIME: 10,
  HREG_B2_OFF_TIME: 300,
  HREG_B3_SP: 500,
  HREG_B3_ON_TIME: 10,
  HREG_B3_OFF_TIME: 300
}

*/