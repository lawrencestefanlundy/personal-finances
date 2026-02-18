/**
 * DVLA Vehicle Enquiry Service (VES) API integration.
 *
 * Free UK government API — register at:
 * https://developer-portal.driver-vehicle-licensing.api.gov.uk/
 *
 * Set DVLA_API_KEY env var to enable live lookups.
 */

const DVLA_VES_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

export interface DvlaVehicle {
  registrationNumber: string;
  make: string;
  colour: string;
  yearOfManufacture: number;
  engineCapacity: number;
  fuelType: string;
  co2Emissions: number;
  taxStatus: string;
  taxDueDate: string;
  motStatus: string;
  motExpiryDate: string;
  dateOfLastV5CIssued: string;
  monthOfFirstRegistration?: string;
  euroStatus?: string;
  markedForExport?: boolean;
  typeApproval?: string;
  wheelplan?: string;
  revenueWeight?: number;
}

export async function lookupDvla(registration: string): Promise<DvlaVehicle | null> {
  const apiKey = process.env.DVLA_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(DVLA_VES_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ registrationNumber: registration.replace(/\s/g, '').toUpperCase() }),
  });

  if (!res.ok) {
    console.error(`DVLA lookup failed for ${registration}: ${res.status}`);
    return null;
  }

  return (await res.json()) as DvlaVehicle;
}
