// src/types/calendarjs.d.ts
// Tipos mínimos para Calendar.js (jcalendar.js), que no incluye definiciones.

export interface EventoCalendarJs {
  id: string;
  title: string;
  from: Date;
  to: Date;
  description?: string;
  color?: string;
  locked?: boolean;
}

export interface OpcionesCalendarJs {
  manualEditingEnabled?: boolean;
  dragAndDropForEventsEnabled?: boolean;
  popUpNotificationsEnabled?: boolean;
  exportEventsEnabled?: boolean;
  importEventsEnabled?: boolean;
  configurationDialogEnabled?: boolean;
  searchEnabled?: boolean;
  showHolidays?: boolean;
  showTimesInMainCalendarEvents?: boolean;
  startOfWeekDay?: number;
  visibleDays?: number[];
  events?: {
    onEventClick?: (evento: EventoCalendarJs) => void;
    onEventUpdated?: (evento: EventoCalendarJs) => void;
    onEventAdded?: (evento: EventoCalendarJs) => void;
    onBeforeEventAddEdit?: (evento: EventoCalendarJs | null) => void;
    onPreviousMonth?: (fecha: Date) => void;
    onNextMonth?: (fecha: Date) => void;
    onToday?: () => void;
    onSetDate?: (fecha: Date) => void;
    onViewChange?: (vista: string) => void;
  };
  [clave: string]: unknown;
}

export interface InstanciaCalendarJs {
  addEvents(eventos: EventoCalendarJs[], updateDom?: boolean, dispararEventos?: boolean): void;
  removeEvent(id: string, updateDom?: boolean, dispararEventos?: boolean): boolean;
  clearEvents(updateDom?: boolean, dispararEventos?: boolean): void;
  refresh(): void;
  getCurrentDisplayDate(): Date;
  updateEventDateTimes(
    id: string,
    from: Date,
    to: Date,
    repeatEnds?: Date | null,
    updateDom?: boolean,
    dispararEventos?: boolean,
  ): boolean;
  destroy(): void;
}

declare global {
  interface Window {
    calendarJs?: (elemento: HTMLElement | string, opciones?: OpcionesCalendarJs) => void;
    __TRANSLATION_OPTIONS?: Record<string, unknown>;
  }
}

export {};
