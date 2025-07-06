import { Socket, Server } from "socket.io";

type DataController = {
  "IREG_TDS_RAW": 0 | 4095
  "IREG_PH_RAW": 0 | 4095
  "IREG_TEMP_RAW": 0 | 4095

  "IREG_LIGHT_LUX": 0 | 65535

  "IREG_LSL": 0 | 1
  "IREG_LSH": 0 | 1
  "STATUS_LIGHT": 0 | 1
  "STATUS_AIR": 0 | 1
  "STATUS_BOMBA_0": 0 | 1
  "STATUS_BOMBA_1": 0 | 1
  "STATUS_BOMBA_2": 0 | 1
  "STATUS_BOMBA_3": 0 | 1

  "COIL_LIGHT": 0 | 1
  "COIL_AIR_PUMP": 0 | 1
  "COIL_BOMBA_0": 0 | 1
  "COIL_BOMBA_1": 0 | 1
  "COIL_BOMBA_2": 0 | 1
  "COIL_BOMBA_3": 0 | 1
  "HREG_MODE": 0 | 1

  "HREG_LIGHT_PWM": 0 | 255
  "HREG_BOMBA_0": 0 | 255
  "HREG_BOMBA_1": 0 | 255
  "HREG_BOMBA_2": 0 | 255
  "HREG_BOMBA_3": 0 | 255

  "HREG_LUX_SP": 0 | 65535
  "HREG_B1_SP": 0 | 65535
  "HREG_B2_SP": 0 | 65535
  "HREG_B3_SP": 0 | 65535

  "HREG_AIR_ON_TIME": number
  "HREG_AIR_OFF_TIME": number
  "HREG_B1_ON_TIME": number
  "HREG_B1_OFF_TIME": number
  "HREG_B2_ON_TIME": number
  "HREG_B2_OFF_TIME": number
  "HREG_B3_ON_TIME": number
  "HREG_B3_OFF_TIME": number
}

type DataReqMQTT = {
  "control/COIL_LIGHT": 0 | 1
  "control/COIL_AIR_PUMP": 0 | 1
  "control/COIL_BOMBA_0": 0 | 1
  "control/COIL_BOMBA_1": 0 | 1
  "control/COIL_BOMBA_2": 0 | 1
  "control/COIL_BOMBA_3": 0 | 1
  "control/HREG_MODE": 0 | 1

  "control/HREG_LIGHT_PWM": 0 | 255
  "control/HREG_BOMBA_0": 0 | 255
  "control/HREG_BOMBA_1": 0 | 255
  "control/HREG_BOMBA_2": 0 | 255
  "control/HREG_BOMBA_3": 0 | 255

  "control/HREG_LUX_SP": 0 | 65535
  "control/HREG_B1_SP": 0 | 65535
  "control/HREG_B2_SP": 0 | 65535
  "control/HREG_B3_SP": 0 | 65535

  "control/HREG_AIR_ON_TIME": number
  "control/HREG_AIR_OFF_TIME": number
  "control/HREG_B1_ON_TIME": number
  "control/HREG_B1_OFF_TIME": number
  "control/HREG_B2_ON_TIME": number
  "control/HREG_B2_OFF_TIME": number
  "control/HREG_B3_ON_TIME": number
  "control/HREG_B3_OFF_TIME": number

  "control/REQ_ALL_DATA": null
}

type DataResMQTT = {
  "control/RES_ALL_DATA": DataController
}

type DataClient = {
  "IREG_TDS_RAW": 0 | 4095
  "IREG_PH_RAW": 0 | 4095
  "IREG_TEMP_RAW": 0 | 4095
  "IREG_LIGHT_LUX": 0 | 65535
  "IREG_LSL": 0 | 1
  "IREG_LSH": 0 | 1
  "STATUS_LIGHT": 0 | 1
  "STATUS_AIR": 0 | 1
  "STATUS_BOMBA_0": 0 | 1
  "STATUS_BOMBA_1": 0 | 1
  "STATUS_BOMBA_2": 0 | 1
  "STATUS_BOMBA_3": 0 | 1
  "HREG_BOMBA_0": 0 | 100
  "HREG_BOMBA_1": 0 | 100
  "HREG_BOMBA_2": 0 | 100
  "HREG_BOMBA_3": 0 | 100

  "HREG_MODE": 0 | 1
  "COIL_LIGHT": 0 | 1
  "COIL_AIR_PUMP": 0 | 1
  "COIL_BOMBA_0": 0 | 1
  "COIL_BOMBA_1": 0 | 1
  "COIL_BOMBA_2": 0 | 1
  "COIL_BOMBA_3": 0 | 1
  "HREG_LIGHT_PWM": 0 | 100
  "HREG_LUX_SP": 0 | 100
  "HREG_B1_SP": 0 | 100
  "HREG_B2_SP": 0 | 100
  "HREG_B3_SP": 0 | 100
  "HREG_PH_SP": 0 | 14
  "HREG_EC_SP": number
  "HREG_AIR_ON_TIME": number
  "HREG_AIR_OFF_TIME": number
  "HREG_B1_ON_TIME": number
  "HREG_B1_OFF_TIME": number
  "HREG_B2_ON_TIME": number
  "HREG_B2_OFF_TIME": number
  "HREG_B3_ON_TIME": number
  "HREG_B3_OFF_TIME": number
}

type control_config = { mode: 0 | 1 }
type luminary_config = { sp: 0 | 100 }
type hydroponic_config = { stPh: number, stEc: number }

type oxygenator_config = { timeOn: number, timeOff: number }
type phosphoricAcid_config = { timeOn: number, timeOff: number, speed: 0 | 100 }
type nutrientSolutionA_config = { timeOn: number, timeOff: number, speed: 0 | 100 }
type nutrientSolutionB_config = { timeOn: number, timeOff: number, speed: 0 | 100 }

type luminary_state = { state: 1 | 0 }
type oxygenator_state = { state: 1 | 0 }
type phosphoricAcid_state = { state: 1 | 0 }
type nutrientSolutionA_state = { state: 1 | 0 }
type nutrientSolutionB_state = { state: 1 | 0 }

type update_data = DataController

type DataEvent = {
  "control-config": (data: control_config) => void
  "luminary-config": (data: luminary_config) => void
  "oxygenator-config": (data: oxygenator_config) => void
  "phosphoricAcid-config": (data: phosphoricAcid_config) => void
  "nutrientSolutionA-config": (data: nutrientSolutionA_config) => void
  "nutrientSolutionB-config": (data: nutrientSolutionB_config) => void
  "hydroponic-config": (data:hydroponic_config) => void

  "luminary-state": (data: luminary_state) => void
  "oxygenator-state": (data: oxygenator_state) => void
  "phosphoricAcid-state": (data: phosphoricAcid_state) => void
  "nutrientSolutionA-state": (data: nutrientSolutionA_state) => void
  "nutrientSolutionB-state": (data: nutrientSolutionB_state) => void

  "/update-data": (data: update_data) => void
}

type SocketData = Socket<DataEvent>;
type ServerSocketData = Server<SocketData>;

export {
  DataClient,
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
  ph_config,
  ec_config,
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