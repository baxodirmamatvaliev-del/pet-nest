import { registerEnumType } from '@nestjs/graphql';

export enum PetType {
	DOG = 'DOG',
	CAT = 'CAT',
	BIRD = 'BIRD',
	OTHER = 'OTHER',
}
registerEnumType(PetType, { name: 'PetType' });

export enum PetListingType {
	SALE = 'SALE',
	ADOPTION = 'ADOPTION',
}
registerEnumType(PetListingType, { name: 'PetListingType' });

export enum PetStatus {
	ACTIVE = 'ACTIVE',
	RESERVED = 'RESERVED',
	SOLD = 'SOLD',
	ADOPTED = 'ADOPTED',
	DELETE = 'DELETE',
}
registerEnumType(PetStatus, { name: 'PetStatus' });

export enum PetGender {
	MALE = 'MALE',
	FEMALE = 'FEMALE',
	UNKNOWN = 'UNKNOWN',
}
registerEnumType(PetGender, { name: 'PetGender' });

export enum PetLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	CHONJU = 'CHONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
}
registerEnumType(PetLocation, { name: 'PetLocation' });
