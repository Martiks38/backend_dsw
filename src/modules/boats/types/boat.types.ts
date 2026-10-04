export type BoatAdminStatus = 'EN_GUARDIA' | 'EN_AGUA' | 'EN_MANTENIMIENTO';

export interface MyBoatCard {
  id: string;
  name: string;
  model: string;
  registrationNumber: string;
  boatTypeName: string;
  contractStartLabel: string | null;
  contractStartISO: string;
  cradleCode: string | null;
  isInGuardia: boolean;
}

export interface BoatAdminListItem {
  id: string;
  registrationNumber: string;
  name: string;
  ownerName: string;
  boatTypeName: string;
  status: BoatAdminStatus;
  cradleCode: string | null;
  plannedEndDatetimeLabel: string | null;
}
