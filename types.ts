export type Status = 'present' | 'absent' | 'wrong_location';
export type OperationMode = 'automatic' | 'monitoring';
export type UserRole = 'admin' | 'dev';
export type Page = 'dashboard' | 'monitoring_dashboard' | 'map' | 'tags' | 'history' | 'users' | 'settings';

export interface MusterStation {
  id: string;
  name: string;
  location: { x: number; y: number };
  expected_count: number;
  operation_mode: OperationMode;
  auto_alert_enabled: boolean;
}

export type ReaderShape = 'circle' | 'rectangle';

export interface CircleShapeConfig {
    shape: 'circle';
    radius: number;
}

export interface RectangleShapeConfig {
    shape: 'rectangle';
    width: number;
    height: number;
    rotation: number;
}


export interface Reader {
  id: string;
  name: string;
  location: { x: number; y: number };
  shapeConfig: CircleShapeConfig | RectangleShapeConfig;
}

export interface Tag {
  id: string;
  tag_number: string;
  name: string;
  job_title: string;
  status: Status;
  muster_station_id: string | null;
  current_muster_station_id?: string | null; // For wrong location tracking
}

export type HistoryLogType = 'simulation-start' | 'simulation-end' | 'check-in' | 'wrong-location-check-in';

export interface HistoryLog {
    id: string;
    timestamp: string;
    type: HistoryLogType;
    muster_station_id: string; // The station where the event occurred
    muster_station_name: string;
    tag_id?: string;
    tag_name?: string;
    tag_number?: string;
    // For wrong location, this is the station the tag *should* have gone to
    original_muster_station_name?: string;
}


// Tipos para a página de configurações
export type ReaderStatus = 'disconnected' | 'connected' | 'failed' | 'testing';
export type ReaderManufacturer = 'Acura' | 'ControlID';

export interface ConfiguredReader {
  id: string;
  name: string;
  manufacturer: ReaderManufacturer;
  ip: string;
  port: number;
  status: ReaderStatus;
  username?: string;
  password?: string;
}