import { sendContact, type ContactPayload } from '@/lib/contactSubmit';

export interface SignupPayload extends ContactPayload {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  poolType: string;
  spa: string;
  heater: string;
  pets: string;
  startDate: string;
  notes: string;
  agreeRequirements: boolean;
  agreeService: boolean;
  agreePrivacy: boolean;
}

// Thin wrapper kept for the signup form's typed payload. Delivery is handled by
// the shared sendContact() layer, so changing how submissions are sent is a
// one-file edit in contactSubmit.ts.
export async function sendSignup(payload: SignupPayload): Promise<void> {
  await sendContact(payload);
}
