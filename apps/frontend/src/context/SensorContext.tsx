import { createContext, useContext } from "react";
import type { SensorData, ConnectionStatus } from "../types/sensor";

export interface SensorContextValue {
  sensorData: SensorData | null;
  status: ConnectionStatus;
}

export const SensorContext = createContext<SensorContextValue>({
  sensorData: null,
  status: "connecting",
});

export function useSensor(): SensorContextValue {
  return useContext(SensorContext);
}
