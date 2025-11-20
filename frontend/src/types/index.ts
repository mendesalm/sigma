export enum DegreeEnum {
  APPRENTICE = "Apprentice",
  FELLOW = "Fellow",
  MASTER = "Master",
  INSTALLED_MASTER = "Installed Master",
}

export enum RegistrationStatusEnum {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

export enum RelationshipTypeEnum {
  SPOUSE = "Spouse",
  SON = "Son",
  DAUGHTER = "Daughter",
}

export interface FamilyMemberResponse {
  id: number;
  full_name: string;
  relationship_type: string;
  birth_date?: string;
  email?: string;
  phone?: string;
  is_deceased: boolean;
  member_id: number;
}

export interface DecorationResponse {
  id: number;
  title: string;
  award_date: string;
  remarks?: string;
  member_id: number;
}

export interface RoleHistoryResponse {
  id: number;
  start_date: string;
  end_date?: string;
  member_id: number;
  role_id: number;
}

export interface MemberResponse {
  id: number;
  full_name: string;
  email: string;
  cpf?: string;
  identity_document?: string;
  birth_date?: string;
  marriage_date?: string;
  street_address?: string;
  street_number?: string;
  neighborhood?: string;
  city?: string;
  zip_code?: string;
  phone?: string;
  place_of_birth?: string;
  nationality?: string;
  religion?: string;
  fathers_name?: string;
  mothers_name?: string;
  education_level?: string;
  occupation?: string;
  workplace?: string;
  profile_picture_path?: string;
  cim?: string;
  status?: string;
  degree?: DegreeEnum;
  initiation_date?: string;
  elevation_date?: string;
  exaltation_date?: string;
  affiliation_date?: string;
  regularization_date?: string;
  philosophical_degree?: string;
  registration_status: RegistrationStatusEnum;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  family_members: FamilyMemberResponse[];
  decorations: DecorationResponse[];
  role_history: RoleHistoryResponse[];
}

export interface SuperAdminResponse {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}
