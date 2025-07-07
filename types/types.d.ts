import { Socket, Server } from "socket.io";

type Int = number;
type Int_1 = 0 | 1;
type Int_8 = 0 | 255;
type Int_12 = 0 | 4095;
type Int_16 = 0 | 65535;

type Percentage = 0 | 100;

type DataConfig = {
  "HREG_MODE": Int_1;

  "COIL_LUX": Int_1;
  "COIL_AIR_PUMP": Int_1;

  "HREG_LUX_PWM": Int_8;
  "HREG_LUX_SP": Int_16;
  "HREG_ON_MS_AIR": Int;
  "HREG_OFF_MS_AIR": Int;

  "COIL_PUMP_0": Int_1
  "COIL_PUMP_1": Int_1
  "COIL_PUMP_2": Int_1

  "HREG_DOPING_SP_0": Int_12
  "HREG_DOPING_SP_1": Int_12
  "HREG_DOPING_SP_2": Int_12

  "HREG_PUMP_0": Int_8
  "HREG_PUMP_1": Int_8
  "HREG_PUMP_2": Int_8

  "HREG_ON_MS_PUMP_0": Int;
  "HREG_ON_MS_PUMP_1": Int;
  "HREG_ON_MS_PUMP_2": Int;

  "HREG_OFF_MS_PUMP_0": Int;
  "HREG_OFF_MS_PUMP_1": Int;
  "HREG_OFF_MS_PUMP_2": Int;
}

type DataStream = {
  "IREG_LSL": Int_1;
  "IREG_LSH": Int_1;

  "IREG_TDS_RAW": Int_12;
  "IREG_PH_RAW": Int_12;
  "IREG_TEMP_RAW": Int_12;

  "IREG_LUX": Int_16;
  "PWM_LUX": Int_8;

  "STATUS_LUX": Int_1;
  "STATUS_AIR": Int_1;

  "STATUS_PUMP_0": Int_1;
  "STATUS_PUMP_1": Int_1;
  "STATUS_PUMP_2": Int_1;

  "LAST_MS_AIR": Int;
  "LAST_MS_PUMP_0": Int;
  "LAST_MS_PUMP_1": Int;
  "LAST_MS_PUMP_2": Int;

  "CURRENT_TIME": Int;
}

type DataController = DataConfig & DataStream;

type DataSetMQTT = {
  "control/REQ_DATA_STREAM": undefined

  "control/HREG_MODE": Int_1;

  "control/COIL_LUX": Int_1;
  "control/COIL_AIR_PUMP": Int_1;

  "control/HREG_LUX_PWM": Int_8;
  "control/HREG_LUX_SP": Int_16;
  "control/HREG_ON_MS_AIR": Int;
  "control/HREG_OFF_MS_AIR": Int;

  "control/COIL_PUMP_0": Int_1
  "control/COIL_PUMP_1": Int_1
  "control/COIL_PUMP_2": Int_1

  "control/HREG_DOPING_SP_0": Int_12
  "control/HREG_DOPING_SP_1": Int_12
  "control/HREG_DOPING_SP_2": Int_12

  "control/HREG_PUMP_0": Int_8
  "control/HREG_PUMP_1": Int_8
  "control/HREG_PUMP_2": Int_8

  "control/HREG_ON_MS_PUMP_0": Int;
  "control/HREG_ON_MS_PUMP_1": Int;
  "control/HREG_ON_MS_PUMP_2": Int;

  "control/HREG_OFF_MS_PUMP_0": Int;
  "control/HREG_OFF_MS_PUMP_1": Int;
  "control/HREG_OFF_MS_PUMP_2": Int;
}

type DataGetMQTT = {
  "control/REFRESH_DATA_STREAM": DataStream;
  "control/REFRESH_DATA_CONFIG": DataConfig;
}

type cnfg_mode = { mode: Int_1 };
type cnfg_lux = { setpoint: Percentage };
type cnfg_doping = { doping_0: Int, doping_1: Int, doping_2: Int };

type cnfg_air = { on_s: Int, off_s: Int };
type cnfg_pump_0 = { on_s: Int, off_s: Int, setpoint: Percentage };
type cnfg_pump_1 = { on_s: Int, off_s: Int, setpoint: Percentage };
type cnfg_pump_2 = { on_s: Int, off_s: Int, setpoint: Percentage };

type state_lux = Int_1;
type state_air = Int_1;
type state_pump_0 = Int_1;
type state_pump_1 = Int_1;
type state_pump_2 = Int_1;

type DataEvent = {
  "/cnfg_mode": (cnfg: cnfg_mode) => void;
  "/cnfg_lux": (cnfg: cnfg_lux) => void;
  "/cnfg_doping": (cnfg: cnfg_doping) => void;
  "/cnfg_air": (cnfg: cnfg_air) => void;
  "/cnfg_pump_0": (cnfg: cnfg_pump_0) => void;
  "/cnfg_pump_1": (cnfg: cnfg_pump_1) => void;
  "/cnfg_pump_2": (cnfg: cnfg_pump_2) => void;

  "/state_lux": (state: state_lux) => void;
  "/state_air": (state: state_air) => void;
  "/state_pump_0": (state: state_pump_0) => void;
  "/state_pump_1": (state: state_pump_1) => void;
  "/state_pump_2": (state: state_pump_2) => void;

  "update_stream": (data: DataStream) => void;
  "update_config": (data: DataConfig) => void;
}

type SocketData = Socket<DataEvent>;
type ServerSocketData = Server<SocketData>;

export {
  Int,
  Int_1,
  Int_8,
  Int_12,
  Int_16,
  Percentage,

  DataConfig,
  DataStream,
  DataController,
  DataSetMQTT,
  DataGetMQTT,

  cnfg_mode,
  cnfg_lux,
  cnfg_doping,
  cnfg_air,
  cnfg_pump_0,
  cnfg_pump_1,
  cnfg_pump_2,
  state_lux,
  state_air,
  state_pump_0,
  state_pump_1,
  state_pump_2,

  DataEvent,

  SocketData,
  ServerSocketData
}