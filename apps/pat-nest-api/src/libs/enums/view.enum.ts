import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	PET = 'PET',
	PRODUCT = 'PRODUCT',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
