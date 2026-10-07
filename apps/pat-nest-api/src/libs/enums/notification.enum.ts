import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
	FOLLOW = 'FOLLOW',
	ORDER = 'ORDER',
	PAYMENT = 'PAYMENT',
	INQUIRY = 'INQUIRY',
	REPLY = 'REPLY',
}
registerEnumType(NotificationType, {
	name: 'NotificationType',
});

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}
registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	PET = 'PET',
	PRODUCT = 'PRODUCT',
	ORDER = 'ORDER',
	SUPPORT = 'SUPPORT',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});
