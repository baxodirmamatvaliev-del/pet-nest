import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	PET = 'PET',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
