import { supabase } from "../config/supabase";
import { logger } from "./logger";

/**
 * Normalizes a phone number by removing stars, spaces, dashes, brackets, and the leading plus.
 * E.g., "+91 98765-43210" -> "919876543210"
 *       "9876543210"       -> "9876543210"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  return phone.replace(/[\*\s\-\(\)\[\]\+]/g, "");
}

/**
 * Compares two phone numbers for a match, taking normalization and Indian country code rules into account.
 */
export function phoneNumbersMatch(phone1: string, phone2: string): boolean {
  const p1 = normalizePhoneNumber(phone1);
  const p2 = normalizePhoneNumber(phone2);
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;

  // Support Indian numbers stored with or without country code (91)
  if (p1.length === 10 && p2 === "91" + p1) return true;
  if (p2.length === 10 && p1 === "91" + p2) return true;

  return false;
}

/**
 * Looks up registered parent/guardian student links from the students table by phone number.
 * Standardizes both the WhatsApp sender number and the database numbers.
 */
export async function getStudentContactsByPhone(phone: string) {
  const normalizedInput = normalizePhoneNumber(phone);
  if (!normalizedInput) return [];

  // Extract the last 10 digits as a suffix filter (safe assumption for Indian phone numbers)
  const last10 = normalizedInput.length >= 10 ? normalizedInput.slice(-10) : normalizedInput;

  // Search the students table for candidates whose parent_phone or guardian_phone ends with this suffix
  const { data: students, error } = await supabase
    .from("students")
    .select("*")
    .or(`parent_phone.like.%${last10},guardian_phone.like.%${last10}`);

  if (error) {
    logger.error(`Error querying students by phone suffix ${last10}:`, error);
    return [];
  }

  const matchedContacts: any[] = [];

  for (const student of students) {
    const parentPhone = student.parent_phone;
    const guardianPhone = student.guardian_phone;

    // Use our helper to compare normalized numbers
    if (parentPhone && phoneNumbersMatch(normalizedInput, parentPhone)) {
      matchedContacts.push({
        student_id: student.id,
        contact_name: student.parent_name || "Parent",
        relationship: "Parent", // Default relationship label for parent flow
        student: student,
      });
    } else if (guardianPhone && phoneNumbersMatch(normalizedInput, guardianPhone)) {
      matchedContacts.push({
        student_id: student.id,
        contact_name: student.guardian_name || "Guardian",
        relationship: "Guardian",
        student: student,
      });
    }
  }

  return matchedContacts;
}
