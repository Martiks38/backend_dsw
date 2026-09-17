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
